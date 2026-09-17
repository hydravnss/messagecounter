const EXTENSION_NAME = 'message-counter';

let badge = null;
let updateTimer = null;
let initialized = false;

function getContext() {
    return SillyTavern.getContext();
}

function getMessageCount() {
    const { chat } = getContext();

    if (Array.isArray(chat)) {
        return chat.length;
    }

    return document.querySelectorAll('#chat .mes').length;
}

function createBadge() {
    if (badge && document.body.contains(badge)) {
        return badge;
    }

    badge = document.createElement('div');
    badge.id = 'message-counter-badge';

    badge.innerHTML = `
        <span class="message-counter-icon">💬</span>
        <span class="message-counter-number">0</span>
    `;

    document.body.appendChild(badge);

    return badge;
}

function updateCounter() {
    const element = createBadge();
    const number = element.querySelector('.message-counter-number');

    number.textContent = getMessageCount();
}

function scheduleUpdate() {
    clearTimeout(updateTimer);

    updateTimer = setTimeout(() => {
        updateCounter();
    }, 50);
}

function init() {
    if (initialized) {
        updateCounter();
        return;
    }

    initialized = true;

    const context = getContext();

    createBadge();
    updateCounter();

    const {
        eventSource,
        event_types,
    } = context;

    const events = [
        event_types.MESSAGE_SENT,
        event_types.MESSAGE_RECEIVED,
        event_types.MESSAGE_DELETED,
        event_types.MESSAGE_UPDATED,
        event_types.MESSAGE_SWIPED,
        event_types.MESSAGE_SWIPE_DELETED,
        event_types.MORE_MESSAGES_LOADED,
        event_types.CHAT_CHANGED,
    ].filter(Boolean);

    for (const event of events) {
        eventSource.on(event, scheduleUpdate);
    }

    const chat = document.querySelector('#chat');

    if (chat) {
        const observer = new MutationObserver(() => {
            scheduleUpdate();
        });

        observer.observe(chat, {
            childList: true,
            subtree: true,
        });
    }

    window.addEventListener('resize', scheduleUpdate);
}

export {
    init,
};