// ===========================
// SyneticaBot — chat client
// ===========================
//
// The Tier 1/2/3 support Workers are push-based: one message can produce a Tier 1
// answer plus Tier 2 and Tier 3 follow-ups arriving seconds apart. So sending is
// fire-and-forget and replies are polled off the ticket transcript, keyed on the
// row id of the last message we've rendered.

(() => {
    const SESSION_KEY = 'synetica_bot_session';
    const POLL_INTERVAL = 1500;
    // A full Tier 1 -> 2 -> 3 chain runs three models back to back, and Tier 3 is
    // a reasoning model. Give it real headroom before declaring silence.
    const POLL_TIMEOUT = 75000;
    const MAX_LENGTH = 1000;

    const TIER_META = {
        user:   { label: 'You',                          cls: 'from-user' },
        tier1:  { label: '1️⃣ Tier 1 — Front line',       cls: 'from-tier1' },
        tier2:  { label: '2️⃣ Tier 2 — Senior',           cls: 'from-tier2' },
        tier3:  { label: '3️⃣ Tier 3 — Principal',        cls: 'from-tier3' },
        system: { label: 'SyneticaBot',                   cls: 'from-system' },
    };

    const els = {
        messages:    document.getElementById('botMessages'),
        form:        document.getElementById('botForm'),
        input:       document.getElementById('botInput'),
        send:        document.getElementById('botSend'),
        newBtn:      document.getElementById('botNewBtn'),
        ticketLabel: document.getElementById('botTicketLabel'),
        statusDot:   document.getElementById('botStatusDot'),
        turnstile:   document.getElementById('botTurnstile'),
    };

    // Bail out quietly if this script is loaded on a page without the chat.
    if (!els.form || !els.messages) return;

    const TIER_OF = { tier1: 1, tier2: 2, tier3: 3 };

    let lastId = 0;
    let pollTimer = null;
    let waitingSince = 0;
    let turnstileToken = null;
    let turnstileWidgetId = null;
    let sending = false;
    // Highest tier we've actually heard from. Compared against the ticket's tier
    // to tell "Tier 2 owns this and hasn't answered yet" apart from "Tier 2 owns
    // this and already answered" — the ticket tier alone can't distinguish them,
    // and treating the second case as pending leaves the page spinning.
    let maxTierSeen = 0;
    let currentTicketId = null;

    // ── session ───────────────────────────────────────────────────────────────
    // A UUID kept in localStorage. The Worker mirrors it into an HttpOnly cookie,
    // but localStorage is what survives a cleared cookie jar mid-conversation.
    function getSessionId() {
        let id = null;
        try { id = localStorage.getItem(SESSION_KEY); } catch { /* private mode */ }
        if (!isUuid(id)) {
            id = crypto.randomUUID();
            try { localStorage.setItem(SESSION_KEY, id); } catch { /* ignore */ }
        }
        return id;
    }

    function isUuid(v) {
        return typeof v === 'string' &&
            /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
    }

    const sessionId = getSessionId();

    // ── rendering ─────────────────────────────────────────────────────────────
    function addMessage(source, content, opts = {}) {
        const meta = TIER_META[source] || TIER_META.system;
        const wrap = document.createElement('div');
        wrap.className = `bot-msg ${meta.cls}`;
        if (opts.id) wrap.dataset.id = String(opts.id);

        if (source !== 'user') {
            const label = document.createElement('div');
            label.className = 'bot-msg-label';
            label.textContent = meta.label;
            wrap.appendChild(label);
        }

        const body = document.createElement('div');
        body.className = 'bot-msg-body';
        // textContent, not innerHTML — model output is never trusted as markup.
        body.textContent = content;
        wrap.appendChild(body);

        els.messages.appendChild(wrap);
        scrollToEnd();
        return wrap;
    }

    function scrollToEnd() {
        els.messages.scrollTop = els.messages.scrollHeight;
    }

    function setTyping(on, note) {
        let el = document.getElementById('botTyping');
        if (!on) {
            if (el) el.remove();
            return;
        }
        if (!el) {
            el = document.createElement('div');
            el.id = 'botTyping';
            el.className = 'bot-msg from-tier1 bot-typing';
            el.innerHTML = '<div class="bot-typing-dots"><span></span><span></span><span></span></div>';
            els.messages.appendChild(el);
        }
        const dots = el.querySelector('.bot-typing-dots');
        if (note && dots && dots.dataset.note !== note) {
            dots.dataset.note = note;
            let label = el.querySelector('.bot-msg-label');
            if (!label) {
                label = document.createElement('div');
                label.className = 'bot-msg-label';
                el.insertBefore(label, dots);
            }
            label.textContent = note;
        }
        scrollToEnd();
    }

    function setBusy(busy) {
        sending = busy;
        els.send.disabled = busy;
        els.statusDot.classList.toggle('busy', busy);
    }

    function updateTicket(ticket) {
        const id = ticket ? ticket.id : null;
        // A different ticket means a fresh escalation ladder to track.
        if (id !== currentTicketId) {
            currentTicketId = id;
            maxTierSeen = 0;
        }

        if (!ticket) {
            els.ticketLabel.textContent = 'New conversation';
            return;
        }
        const tier = ticket.tier > 1 ? ` · with Tier ${ticket.tier}` : '';
        els.ticketLabel.textContent = `Ticket ${ticket.id}${tier}`;
    }

    // ── polling ───────────────────────────────────────────────────────────────
    function startPolling() {
        waitingSince = Date.now();
        if (pollTimer) return;
        pollTimer = setInterval(poll, POLL_INTERVAL);
        poll();
    }

    function stopPolling() {
        if (pollTimer) {
            clearInterval(pollTimer);
            pollTimer = null;
        }
        setTyping(false);
        setBusy(false);
    }

    async function poll() {
        let data;
        try {
            const res = await fetch(`/api/bot/poll?after=${lastId}`, {
                headers: { 'X-Bot-Session': sessionId },
            });
            if (!res.ok) throw new Error(`poll ${res.status}`);
            data = await res.json();
        } catch (err) {
            console.error('SyneticaBot poll failed:', err);
            return; // transient — the next tick retries
        }

        // Ticket first: a [[NEW_TICKET]] mid-conversation resets which tiers we're
        // still waiting on.
        updateTicket(data.ticket);
        const openTicketId = data.ticket ? data.ticket.id : null;

        const fresh = (data.messages || []).filter(m => m.id > lastId);
        let gotReply = false;
        for (const m of fresh) {
            lastId = Math.max(lastId, m.id);
            // Our own turn is already on screen from the optimistic render.
            if (m.source === 'user') continue;
            setTyping(false);
            addMessage(m.source, m.content, { id: m.id });
            if (m.ticket_id === openTicketId) {
                maxTierSeen = Math.max(maxTierSeen, TIER_OF[m.source] || 0);
            }
            waitingSince = Date.now();
            gotReply = true;
        }

        // A tier owns the ticket but hasn't spoken on it yet — its reply is coming.
        const ticketTier = data.ticket ? data.ticket.tier : 0;
        const pendingTier = ticketTier > maxTierSeen ? ticketTier : 0;

        if (gotReply) {
            // Hand the input back as soon as anything lands, even if a higher tier
            // is still working.
            setBusy(false);
            if (!pendingTier) {
                stopPolling();
                return;
            }
            setTyping(true, `Escalated to Tier ${pendingTier} — reviewing…`);
            return;
        }

        if (Date.now() - waitingSince >= POLL_TIMEOUT) {
            stopPolling();
            addMessage(
                'system',
                "That's taking longer than expected. Send another message to retry, or reach us at (716) 259-2627.",
            );
        }
    }

    // ── sending ───────────────────────────────────────────────────────────────
    async function send(text, opts = {}) {
        setBusy(true);
        // Slash commands are plumbing, not conversation — don't echo them as if the
        // visitor said them out loud.
        if (!opts.silent) addMessage('user', text);
        setTyping(true);

        let res;
        try {
            res = await fetch('/api/bot/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Bot-Session': sessionId,
                },
                body: JSON.stringify({ message: text, turnstileToken }),
            });
        } catch (err) {
            console.error('SyneticaBot send failed:', err);
            failSend('Could not reach the support desk. Check your connection and try again.');
            return;
        }

        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            // 403 means the bot check didn't pass — get a fresh token so the
            // visitor's retry has a chance of succeeding.
            if (res.status === 403) resetTurnstile();
            failSend(data.message || 'Something went wrong sending that. Please try again.');
            return;
        }

        startPolling();
    }

    function failSend(message) {
        setTyping(false);
        setBusy(false);
        addMessage('system', message);
        if (typeof showNotification === 'function') showNotification(message, 'error');
    }

    // ── Turnstile ─────────────────────────────────────────────────────────────
    // The sitekey is injected by the Worker at /api/bot/config so it isn't
    // duplicated between wrangler.toml and this file.
    async function initTurnstile() {
        if (!window.turnstile || !els.turnstile) return;

        let sitekey;
        try {
            const res = await fetch('/api/bot/config');
            ({ turnstileSitekey: sitekey } = await res.json());
        } catch (err) {
            console.error('SyneticaBot config fetch failed:', err);
            return;
        }
        if (!sitekey) return; // protection not configured — Worker decides whether to allow

        turnstileWidgetId = window.turnstile.render(els.turnstile, {
            sitekey,
            appearance: 'interaction-only',
            callback: (token) => { turnstileToken = token; },
            'expired-callback': () => { turnstileToken = null; resetTurnstile(); },
            'error-callback': () => { turnstileToken = null; },
        });
    }

    function resetTurnstile() {
        turnstileToken = null;
        if (window.turnstile && turnstileWidgetId !== null) {
            try { window.turnstile.reset(turnstileWidgetId); } catch { /* ignore */ }
        }
    }

    // Turnstile calls this once its script is ready (see the onload= param).
    window.onTurnstileReady = initTurnstile;

    // ── wiring ────────────────────────────────────────────────────────────────
    els.form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (sending) return;
        const text = els.input.value.trim().slice(0, MAX_LENGTH);
        if (!text) return;
        els.input.value = '';
        autosize();
        send(text);
    });

    // Enter sends, Shift+Enter makes a newline.
    els.input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            els.form.requestSubmit();
        }
    });

    function autosize() {
        els.input.style.height = 'auto';
        els.input.style.height = `${Math.min(els.input.scrollHeight, 160)}px`;
    }
    els.input.addEventListener('input', autosize);

    els.newBtn.addEventListener('click', () => {
        if (sending) return;
        maxTierSeen = 0;
        send('/new', { silent: true });
    });

    // ── first load ────────────────────────────────────────────────────────────
    // Replay this visitor's existing transcript so a refresh doesn't lose the
    // thread, then greet them if there's nothing to replay.
    (async function restore() {
        try {
            const res = await fetch(`/api/bot/poll?after=0`, {
                headers: { 'X-Bot-Session': sessionId },
            });
            if (res.ok) {
                const data = await res.json();
                updateTicket(data.ticket);
                const openTicketId = data.ticket ? data.ticket.id : null;
                for (const m of data.messages || []) {
                    lastId = Math.max(lastId, m.id);
                    addMessage(m.source, m.content, { id: m.id });
                    if (m.ticket_id === openTicketId) {
                        maxTierSeen = Math.max(maxTierSeen, TIER_OF[m.source] || 0);
                    }
                }
            }
        } catch (err) {
            console.error('SyneticaBot restore failed:', err);
        }

        if (!els.messages.children.length) {
            addMessage(
                'tier1',
                "Hi — I'm SyneticaBot, Synetica's AI support desk. Tell me what's going wrong and I'll start troubleshooting. If it needs more depth I'll pull in a senior engineer.",
            );
        }
    })();
})();
