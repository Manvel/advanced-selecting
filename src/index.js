import {html, css, LitElement} from "lit";

export class AdvancedSelecting extends LitElement {
  static get styles() {
    return css`
      h1 { color: blue }
      ul li {
        margin: 5px;
        max-width: 300px;
      }
      [data-action-hover="getElement"] {
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

      #query {
        width: 300px;
        height: 30px
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
      },
      useXpath: {
        type: Boolean
      }
    }
  }

  constructor() {
    super();
    this.header = "Advanced selector";
    this.treeElements = [];
    this.relativeTreeElements = [];
    this.pickingType = "main";
    this.lastQueryHighlightedValue = "";
    this.useXpath = false;
  }

  firstUpdated() {
    this.mainVisualTree = this.renderRoot.querySelector("#mainVisualTree");
    const highlightTarget = (target, clearHighlight) => {
      const type = target.dataset.type;
      const index = target.dataset.index;
      const tree = type === "main" ? this.treeElements : this.relativeTreeElements.slice(1);
      if (clearHighlight) delete tree[index].element.dataset.advancedSelectingHover;
      else tree[index].element.dataset.advancedSelectingHover = true;
    };

    this.mainVisualTree.addEventListener("mouseover", ({target}) =>
    {
      const actionElement = this._findClosestElement(target, ({dataset}) => dataset && dataset.actionHover);
      if (actionElement)
        highlightTarget(actionElement);
    });
    this.mainVisualTree.addEventListener("mouseout", ({target}) =>
    {
      const actionElement = this._findClosestElement(target, ({dataset}) => dataset && dataset.actionHover);
      if (actionElement)
        highlightTarget(actionElement, true);
    });

    this.mainVisualTree.addEventListener("click", (event) => {
      const actionElement = this._findClosestElement(event.target, ({dataset}) => dataset && dataset.actionClick);
      if (actionElement) {
        const action = actionElement.dataset.actionClick;

        if (action === "toggleClass") {
          const container = this._findClosestElement(event.target, ({dataset}) => dataset && dataset.index);
          if (!container) return;

          const {index, type} = container.dataset;
          const tree = type === "main" ? this.treeElements : this.relativeTreeElements.slice(1);
          if (actionElement.checked) {
            tree[index].includeClasses.push(actionElement.dataset.value);
          } else {
            tree[index].includeClasses = tree[index].includeClasses.filter((className) => className !== actionElement.dataset.value);
          }
          this.requestUpdate();
        }
        else if (action === "toggleId") {
          const container = this._findClosestElement(event.target, ({dataset}) => dataset && dataset.index);
          if (!container) return;

          const {index, type} = container.dataset;
          const tree = type === "main" ? this.treeElements : this.relativeTreeElements.slice(1);
          if (actionElement.checked) {
            tree[index].includeID = true;
          } else {
            tree[index].includeID = false;
          }
          this.requestUpdate();
        }
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

  _renderId(id, includeID) {
    return html`<div>ID: <label>${id}<input data-action-click="toggleId" type="checkbox" ${includeID ? "checked" : ""}</label></div>`;
  }

  _renderClasses(classlist, classesToInclude) {
    return html`<div>Classes: ${Array.from(classlist).map((className) => 
      html`
        <label>${className}<input data-action-click="toggleClass" type="checkbox" data-value="${className}"></label>
      `)}</div>
    `;
  }

  _renderNode({element, includeClasses, includeID}, type = "main", index) {
    return html`
    <ul>
      <li data-action-hover="getElement" data-type="${type}" data-index=${index}>
        <span>Tagname: ${element.tagName}</span>
        ${element.classList.length ? this._renderClasses(element.classList, includeClasses): ""}
        ${element.id ? this._renderId(element.id, includeID) : ""}
      </li>
    </ul>
    `;
  }

  generateQuery() {
    const getNthType = (element) => {
      const tagName = element.tagName.toLowerCase();
      let numberOfTypes = 0;
      while (element = element.previousElementSibling) {
        if (element.tagName.toLowerCase() == tagName)
          numberOfTypes++;
      }
      if (numberOfTypes) {
        if (this.useXpath) {
          return `['${numberOfTypes + 1}']`
        } else {
          return `:nth-of-type(${numberOfTypes + 1})`
        }
      }
      return ""
    }

    const delimiter = this.useXpath ? "/" : " ";
    const prefix = this.useXpath ? "//" : "";

    const query = this.treeElements.reduce((acc, {element, includeClasses, includeID}) => {
      if (!acc) return element.tagName;
      return `${acc}${delimiter}${element.tagName}${getNthType(element)}${includeID ? "#" + element.id : ""}${includeClasses.length ? "." + includeClasses.join(".") : ""}`
    }, "");

    return `${prefix}${query}`;
  }

  _getElementByXPath(xpathExpression) {
    return document.evaluate(
      xpathExpression,
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    ).singleNodeValue;
  }

  showTargetByQuery({target}) {
    const element = this.useXpath ? this._getElementByXPath(target.value) : document.querySelector(target.value);
    if (!element) return;
    element.dataset.advancedSelectingHover = true;
    this.lastQueryHighlightedValue = target.value;
  }

  hideTargetByQuery() {
      if (this.lastQueryHighlightedValue) {
        const element = this.useXpath ? this._getElementByXPath(this.lastQueryHighlightedValue) : document.querySelector(this.lastQueryHighlightedValue);
        delete element.dataset.advancedSelectingHover;
      }
  }

  _renderRelativeBranch(parentDataElem, index) {
    return html`
    ${this._renderNode(parentDataElem, "main", index)}
    <ul id="relativeVisualTree">
      ${this.relativeTreeElements.slice(1).map((dataElem, relativeIndex) => 
        html`
          <li>
            ${this._renderNode(dataElem, "relative", relativeIndex)}
          </li>
        `
        )}
    </ul>
    `;
  }

  _renderVisualTree() {
    return this.treeElements.map((dataElem, index) =>
      html`
        <li class="${this.relativeTreeElements[0] && dataElem.element.contains(this.relativeTreeElements[0].element) ? "commonParent" : ""}">
          ${this.relativeTreeElements[0] && dataElem.element === this.relativeTreeElements[0].element ? this._renderRelativeBranch(dataElem, index) : this._renderNode(dataElem, "main", index)}
        </li>
      `
    );
  }

  render() {
    return html`
      <h1>${this.header}!</h1>
      <button @click="${this.startPicking}" data-pick-type="main">Pick element</button>
      <button @click="${this.startPicking}" data-pick-type="relative">Pick relative element</button>
      <input id="query" type="text" value="${this.generateQuery()}" @mouseover="${this.showTargetByQuery}" @mouseout="${this.hideTargetByQuery}">
      <label>Use XPath<input type="checkbox" @click="${() => this.useXpath = !this.useXpath}"></label>
      <ul id="mainVisualTree">
        ${this._renderVisualTree()}
      </ul>
    `;
  }
}

customElements.define("advanced-selecting", AdvancedSelecting);
