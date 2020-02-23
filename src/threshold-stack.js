/* https://github.com/thomasloven/lovelace-card-tools/blob/master/src/lit-element.js */
export const LitElement = customElements.get('home-assistant-main')
  ? Object.getPrototypeOf(customElements.get('home-assistant-main'))
  : Object.getPrototypeOf(customElements.get('hui-view'));
export const html = LitElement.prototype.html;
export const css = LitElement.prototype.css;

/* https://github.com/thomasloven/lovelace-card-tools/blob/master/src/hass.js */
function hass() {
  if(document.querySelector('hc-main'))
    return document.querySelector('hc-main').hass;

  if(document.querySelector('home-assistant'))
    return document.querySelector('home-assistant').hass;

  return undefined;
};

function lovelace_view() {
  var root = document.querySelector("hc-main");
  if(root) {
    root = root && root.shadowRoot;
    root = root && root.querySelector("hc-lovelace");
    root = root && root.shadowRoot;
    root = root && root.querySelector("hui-view");
    return root;
  }

  root = document.querySelector("home-assistant");
  root = root && root.shadowRoot;
  root = root && root.querySelector("home-assistant-main");
  root = root && root.shadowRoot;
  root = root && root.querySelector("app-drawer-layout partial-panel-resolver");
  root = root && root.shadowRoot || root;
  root = root && root.querySelector("ha-panel-lovelace");
  root = root && root.shadowRoot;
  root = root && root.querySelector("hui-root");
  root = root && root.shadowRoot;
  root = root && root.querySelector("ha-app-layout #view");
  root = root && root.firstElementChild;
  return root;
}

/* https://github.com/thomasloven/lovelace-card-tools/blob/master/src/event.js */
function fireEvent(ev, detail, entity=null) {
  ev = new Event(ev, {
    bubbles: true,
    cancelable: false,
    composed: true,
  });
  ev.detail = detail || {};
  if(entity) {
    entity.dispatchEvent(ev);
  } else {
    var root = lovelace_view();
    if (root) root.dispatchEvent(ev);
  }
}

/* https://github.com/thomasloven/lovelace-card-tools/blob/master/src/lovelace-element.js */
export const CUSTOM_TYPE_PREFIX = "custom:";

let helpers = window.cardHelpers;
const helperPromise = new Promise(async (resolve, reject) => {
  if(helpers) resolve();
  if(window.loadCardHelpers) {
    helpers = await window.loadCardHelpers();
    window.cardHelpers = helpers;
    resolve();
  }
});

function errorElement(error, origConfig) {
  const el = document.createElement("hui-error-card");
  el.setConfig({
    type: "error",
    error,
    origConfig,
  });
  return el;
}

function _createElement(tag, config) {
  let el = document.createElement(tag);

  try {
    el.setConfig(JSON.parse(JSON.stringify(config)));
  } catch (ex) {
    el = errorElement(err, config);
  }

  helperPromise.then(() => {
    fireEvent("ll-rebuild", {}, el);
  });
  return el;
}

function createLovelaceElement(thing, config) {
  if(!config || typeof config !== "object" || !config.type)
    return errorElement(`No ${thing} type configured`, config);

  let tag = config.type;
  if(tag.startsWith(CUSTOM_TYPE_PREFIX))
    tag = tag.substr(CUSTOM_TYPE_PREFIX.length);
  else
    tag = `hui-${tag}-${thing}`;

  if(customElements.get(tag))
    return _createElement(tag, config);

  const el = errorElement(`Custom element doesn't exist: ${tag}.`, config);
  el.style.display = "None";

  const timer = setTimeout(() => {
    el.style.display = "";
  }, 2000);

  customElements.whenDefined(tag).then(() => {
    clearTimeout(timer);
    fireEvent("ll-rebuild", {}, el);
  });

  return el;
}

function createCard(config) {
  if(helpers) return helpers.createCardElement(config);
  return createLovelaceElement('card', config);
}

/* Core */
class ThresholdStack extends LitElement {
  static get properties() {
    return {
      hass: {}
    }
  }

  setConfig(config) {
    this.config = config;
    this.config.threshold = parseInt(this.config.threshold) || 800;

    this.cards = {};
    for (let k in config.cards) {
      this.cards[k] = createCard(config.cards[k]);
      this.cards[k].hass = hass();
    }

    window.addEventListener('resize', el => {
      this.shadowRoot.querySelector('#root').className = window.matchMedia(`(min-width: ${this.config.threshold}px)`).matches ? 'horizontal' : 'vertical';
    });
  }

  updated(changedProperties) {
    if (changedProperties.has('hass')) {
      for (let k in this.cards) {
        this.cards[k].hass = this.hass;
      }
    }
  }

  render() {
    return html`
      <div id="root" class="${window.matchMedia(`(min-width: ${this.config.threshold}px)`).matches ? 'horizontal' : 'vertical'}">
        ${Object.keys(this.cards).map((k) =>
          html`
            ${this.cards[k]}
          `)}
      </div>
    `;
  }

  static get styles() {
    return css`
      #root { display: flex; }

      /* horizontal for wide devices */
      #root.horizontal > * { flex: 1 1 0; margin: 0 4px; }
      #root.horizontal > *:first-child { margin-left: 0; }
      #root.horizontal > *:last-child { margin-right: 0; }

      /* vertical for narrow devices */
      #root.vertical { flex-direction: column; }
      #root.vertical > * { margin: 4px 0; }
      #root.vertical > *:first-child { margin-top: 0; }
      #root.vertical > *:last-child { margin-bottom: 0; }
    `;
  }
}

customElements.define('threshold-stack', ThresholdStack);
