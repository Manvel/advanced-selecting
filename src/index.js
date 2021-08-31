import {html, css, LitElement} from "lit";

export class AdvancedSelecting extends LitElement {
  static get styles() {
    return css`
      h1 { color: blue }
      #visualNodes li {
        margin: 5px;
      }
      #visualNodes li span {
        display: inline-block;
        border: 1px solid grey;
      }
    `;
  }

  static get properties() {
    return {
      header: {
        type: String
      },
      treeElements: {
        type: Array
      }
    }
  }

  constructor() {
    super();
    this.header = "Advanced selector";
    this.treeElements = [];
    this.relativeTreeElements = [];
    this.pickingType = "main";
  }

  firstUpdated() {
    this.visualNodes = this.renderRoot.querySelector("#visualNodes");
    this.visualNodes.addEventListener("mouseover", ({target}) =>
    {
      const action = target.dataset.action;
      if (action === "getElement") {
        const listItem = this._findClosestElementByTagName(target, "LI");
        const index = [...listItem.parentElement.children].indexOf(listItem);
        this.treeElements[index].dataset.advancedSelectingHover = true;
      }
    });
    this.visualNodes.addEventListener("mouseout", ({target}) =>
    {
      const action = target.dataset.action;
      if (action === "getElement") {
        const listItem = this._findClosestElementByTagName(target, "LI");
        const index = [...listItem.parentElement.children].indexOf(listItem);
        delete this.treeElements[index].dataset.advancedSelectingHover;
      }
    });
  }

  onDOMElementHover({target}) {
    target.dataset.advancedSelectingHover = true;
  }

  onDOMElementOut({target}) {
    delete target.dataset.advancedSelectingHover;
  }

  onDOMElementClick({target}) {
    const advancedSelector = document.querySelector("advanced-selecting");
    if (!advancedSelector.contains(target)) {
      advancedSelector.endPicking();
      delete target.dataset.advancedSelectingHover;
      advancedSelector.generateTree(target);
    }
    else {
      target.dataset.advancedSelectingHover = true;
    }
  }

  _findClosestElementByTagName(element, tagName) {
    while (element && element !== document.documentElement) {
      if (element.tagName === tagName) {
        return element;
      }
      element = element.parentElement;
    }
    return null;
  }

  startPicking({target}) {
    this.pickingType = target.dataset.pickType;
    document.addEventListener("mouseover", this.onDOMElementHover);
    document.addEventListener("mouseout", this.onDOMElementOut);
    document.addEventListener("click", this.onDOMElementClick);
  }

  endPicking() {
    document.removeEventListener("mouseover", this.onDOMElementHover);
    document.removeEventListener("mouseout", this.onDOMElementOut);
    document.removeEventListener("click", this.onDOMElementClick);
  }

  generateTree(element) {
    this.treeElements = [];
    while (element && element !== document.documentElement)
    {
      this.treeElements.unshift(element);
      element = element.parentElement;
    }
    this.requestUpdate();
  }

  previousSiblings(element) {
  }

  elementsTemplate() {
    return html`
      ${this.treeElements.map((element) =>
        html`
          <li>
            <span data-action="getElement">${element.tagName}</span>
          </li>
        `
      )}
    `;
  }

  render() {
    return html`
      <h1>${this.header}!</h1>
      <button @click="${this.startPicking}" data-pick-type="main">Pick element</button>
      <button @click="${this.startPicking}" data-pick-type="relative">Pick relative element</button>
      <ul id="visualNodes">
        ${this.elementsTemplate()}
      </ul>
      <span id="query"></span>
    `;
  }
}

customElements.define("advanced-selecting", AdvancedSelecting);
