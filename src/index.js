import {html, css, LitElement} from "lit";

export class AdvancedSelecting extends LitElement {
  static get styles() {
    return css`
      h1 { color: blue }
      ul li {
        margin: 5px;
        max-width: 300px;
      }
      [data-action="getElement"] {
        display: inline-block;
        border: 1px solid grey;
      }

      ul {
        list-style: none;
        width: 100%;
      }
      
      #mainVisualTree > li {
        margin: 20px 0;
        position: relative;
      }
      
      .commonParent {
        position: absolute;
        left: 140px;
      }
      
      #relativeVisualTree > li {
        margin: 20px 0;
      }
      
      #relativeVisualTree {
        position: absolute;
        left: 100px;
        top: 31px;
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
    this.mainVisualTree = this.renderRoot.querySelector("#mainVisualTree");
    const highlightTarget = (target, clearHighlight) => {
      const action = target.dataset.action;
      const type = target.dataset.type;
      if (action === "getElement") {
        const index = target.dataset.index;
        const tree = type === "main" ? this.treeElements : this.relativeTreeElements.slice(1);
        if (clearHighlight) delete tree[index].element.dataset.advancedSelectingHover;
        else tree[index].element.dataset.advancedSelectingHover = true;
      }
    };

    this.mainVisualTree.addEventListener("mouseover", ({target}) =>
    {
      const actionElement = this._findClosestElement(target, ({dataset}) => dataset && dataset.action);
      if (actionElement)
        highlightTarget(actionElement);
    });
    this.mainVisualTree.addEventListener("mouseout", ({target}) =>
    {
      const actionElement = this._findClosestElement(target, ({dataset}) => dataset && dataset.action);
      if (actionElement)
        highlightTarget(actionElement, true);
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
    // Don't select actual component
    if (!advancedSelector.contains(target)) {
      advancedSelector.endPicking();
      delete target.dataset.advancedSelectingHover;
      if (advancedSelector.pickingType == "main") {
        advancedSelector.generateTree(target);
      } else {
        advancedSelector.generateRelativeTree(target);
      }
    }
    else {
      target.dataset.advancedSelectingHover = true;
    }
  }

  _findClosestElement(element, condition) {
    while (element && element !== document.documentElement) {
      if (condition && condition(element)) {
        return element;
      }
      element = element.parentElement;
    }
    return null;
  }

  startPicking({target}) {
    this.relativeTreeElements = [];
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
      const elementData = {element, includeClasses: [], includeID: false};
      this.treeElements.unshift(elementData);
      element = element.parentElement;
    }
    this.requestUpdate();
  }

  generateRelativeTree(element) {
    this.relativeTreeElements = [];
    while (element && element !== document.documentElement)
    {
      const elementData = {element, includeClasses: [], includeID: false};
      this.relativeTreeElements.unshift(elementData);
      if (this.treeElements.find((mainElemData) => mainElemData.element == element))
        break;
      element = element.parentElement;
    }
    this.requestUpdate();
  }

  _renderClasses(classlist) {
    return html`<div>Classes: ${Array.from(classlist).map((className) => 
      html`
        <label>${className}<input type="checkbox"></label>
      `)}</div>
    `;
  }

  _renderNode(element, type = "main", index) {
    return html`
    <ul>
      <li data-action="getElement" data-type="${type}" data-index=${index}>
        <span>Tagname: ${element.tagName}</span>
        ${element.classList.length ? this._renderClasses(element.classList): ""}
      </li>
    </ul>
    `;
  }

  generateQuery() {
    return this.treeElements.reduce((acc, {element}) => {
      if (!acc) return element.tagName;
      return `${acc} > ${element.tagName}`
    }, "");
  }

  _renderRelativeBranch(parent, index) {
    return html`
    ${this._renderNode(parent, "main", index)}
    <ul id="relativeVisualTree">
      ${this.relativeTreeElements.slice(1).map(({element}, relativeIndex) => 
        html`
          <li>
            ${this._renderNode(element, "relative", relativeIndex)}
          </li>
        `
        )}
    </ul>
    `;
  }

  _renderVisualTree() {
    return this.treeElements.map(({element}, index) =>
      html`
        <li class="${this.relativeTreeElements[0] && element.contains(this.relativeTreeElements[0].element) ? "commonParent" : ""}">
          ${this.relativeTreeElements[0] && element === this.relativeTreeElements[0].element ? this._renderRelativeBranch(element, index) : this._renderNode(element, "main", index)}
        </li>
      `
    );
  }

  render() {
    return html`
      <h1>${this.header}!</h1>
      <button @click="${this.startPicking}" data-pick-type="main">Pick element</button>
      <button @click="${this.startPicking}" data-pick-type="relative">Pick relative element</button>
      <span id="query">${this.generateQuery()}</span>
      <ul id="mainVisualTree">
        ${this._renderVisualTree()}
      </ul>
    `;
  }
}

customElements.define("advanced-selecting", AdvancedSelecting);
