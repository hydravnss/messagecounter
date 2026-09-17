const EXTENSION_NAME = 'messagecounter';

let counterElement = null;
let updateTimer = null;
let observer = null;
let initialized = false;


/* ==========================================================
   CONTEXTE SILLYTAVERN
   ========================================================== */

function getContext() {
    return SillyTavern.getContext();
}


/* ==========================================================
   COMPTER LES MESSAGES
   ========================================================== */

function getMessageCount() {
    const context = getContext();

    if (Array.isArray(context.chat)) {
        return context.chat.length;
    }

    return document.querySelectorAll('#chat .mes').length;
}


/* ==========================================================
   CREER LE COMPTEUR
   ========================================================== */

function createCounter() {
    if (counterElement && document.body.contains(counterElement)) {
        return counterElement;
    }

    const rightSendForm = document.querySelector('#rightSendForm');

    if (!rightSendForm) {
        return null;
    }

    // Évite les doublons
    const existing = rightSendForm.querySelector('#message-counter');

    if (existing) {
        counterElement = existing;
        return existing;
    }

    counterElement = document.createElement('div');

    counterElement.id = 'message-counter';

    counterElement.innerHTML = `
        <span class="message-counter-icon">💬</span>
        <span class="message-counter-number">0</span>
    `;

    /*
     * On place le compteur directement dans la zone
     * des boutons d'envoi.
     *
     * Il sera donc toujours attaché à la barre de saisie.
     */

    const sendButton = rightSendForm.querySelector('#send_but');

    if (sendButton) {
        rightSendForm.insertBefore(counterElement, sendButton);
    } else {
        rightSendForm.appendChild(counterElement);
    }

    return counterElement;
}


/* ==========================================================
   MISE À JOUR
   ========================================================== */

function updateCounter() {
    const element = createCounter();

    if (!element) {
        return;
    }

    const number = element.querySelector(
        '.message-counter-number'
    );

    if (!number) {
        return;
    }

    number.textContent = String(getMessageCount());
}


function scheduleUpdate() {
    clearTimeout(updateTimer);

    updateTimer = setTimeout(() => {
        updateCounter();
    }, 50);
}


/* ==========================================================
   SURVEILLER LA BARRE D'ENVOI
   ========================================================== */

function watchSendBar() {
    if (observer) {
        observer.disconnect();
    }

    observer = new MutationObserver(() => {
        /*
         * Le thème peut reconstruire #rightSendForm.
         * On vérifie simplement que notre compteur existe encore.
         */

        if (!document.querySelector('#message-counter')) {
            createCounter();
        }

        updateCounter();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });
}


/* ==========================================================
   INITIALISATION
   ========================================================== */

function init() {
    if (initialized) {
        updateCounter();
        return;
    }

    initialized = true;

    const context = getContext();

    createCounter();
    updateCounter();

    /*
     * Événements SillyTavern
     */

    if (context.eventSource && context.event_types) {

        const events = [
            context.event_types.MESSAGE_SENT,
            context.event_types.MESSAGE_RECEIVED,
            context.event_types.MESSAGE_DELETED,
            context.event_types.MESSAGE_UPDATED,
            context.event_types.MESSAGE_SWIPED,
            context.event_types.MESSAGE_SWIPE_DELETED,
            context.event_types.MORE_MESSAGES_LOADED,
            context.event_types.CHAT_CHANGED,
        ].filter(Boolean);

        for (const event of events) {
            context.eventSource.on(event, scheduleUpdate);
        }
    }

    watchSendBar();

    /*
     * Certaines interfaces mobiles créent la barre
     * quelques instants après le chargement.
     */

    let attempts = 0;

    const waitForBar = setInterval(() => {

        createCounter();
        updateCounter();

        attempts++;

        if (
            document.querySelector('#rightSendForm #message-counter') ||
            attempts >= 60
        ) {
            clearInterval(waitForBar);
        }

    }, 250);
}


/* ==========================================================
   EXPORT SILLYTAVERN
   ========================================================== */

export {
    init,
};