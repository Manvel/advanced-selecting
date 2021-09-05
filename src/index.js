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
    this._whitelistedAttributes = ["class", "id", "href"];
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

    this.mainVisualTree.addEventListener("click", this._visualTreeClickHandler.bind(this));
  }

  _findTreeElementByDomElement({dataset}) {
    if (!dataset) return null;
    const {index, type} = dataset;
    const tree = type === "main" ? this.treeElements : this.relativeTreeElements.slice(1);
    return tree[index];
  }

  _visualTreeClickHandler(event) {
    const actionElement = this._findClosestElement(event.target, ({dataset}) => dataset && dataset.actionClick);
    if (actionElement) {
      const action = actionElement.dataset.actionClick;
      const container = this._findClosestElement(event.target, ({dataset}) => dataset && dataset.index);
      if (!container || !action) return null;

      switch (action) {
        case "toggleAttribute":
          const treeElement = this._findTreeElementByDomElement(container);
          const attributeName = actionElement.dataset.attrName;
          const attributeValue = actionElement.dataset.attrValue;
          const shouldInclude = actionElement.checked;
          if (shouldInclude) {
            if (treeElement.attributes[attributeName]) {
              treeElement.attributes[attributeName].push(attributeValue);
            } else {
              treeElement.attributes[attributeName] = [attributeValue]
            }
          }
          else {
            treeElement.attributes[attributeName] = treeElement.attributes[attributeName].filter((value) => attributeValue !== value);
          }
          this.requestUpdate();
          break;
      }
    }
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
      const elementData = {element, attributes: {}};
      this.treeElements.unshift(elementData);
      element = element.parentElement;
    }
    this.requestUpdate();
  }

  generateRelativeTree(element) {
    this.relativeTreeElements = [];
    while (element && element !== document.documentElement)
    {
      const elementData = {element, attributes: {}};
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

  _renderClasses(classlist) {
    return html`<div>Classes: ${Array.from(classlist).map((className) => 
      html`
        <label>${className}<input data-action-click="toggleClass" type="checkbox" data-value="${className}"></label>
      `)}</div>
    `;
  }

  _renderAttributes(element) {
    const attributeTemplates = [];
    for (const name of element.getAttributeNames()) {
      if (!this._whitelistedAttributes.includes(name)) continue;
      const value = element.getAttribute(name);
      if (name === "class") {
        const template = html`<div>Classes: 
          ${Array.from(element.classList).map((classNameValue) => {
            return html`
              <label>${classNameValue}<input data-action-click="toggleAttribute" type="checkbox" data-attr-name="${name}" data-attr-value="${classNameValue}"></label>
            `;
          })}
        </div>`;
        attributeTemplates.push(template);
      } else {
        const template = html`
        <div>${name}: 
          <label>${value}<input data-action-click="toggleAttribute" type="checkbox" data-attr-name="${name}" data-attr-value="${value}"></label>
        </div>`;
        attributeTemplates.push(template);
      }
      
    }
    return attributeTemplates;
  }

  _renderNode({element}, type = "main", index) {
    return html`
    <ul>
      <li data-action-hover="getElement" data-type="${type}" data-index=${index}>
        <span>Tagname: ${element.tagName}</span>
        ${this._renderAttributes(element)}
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
          return `[${numberOfTypes + 1}]`
        } else {
          return `:nth-of-type(${numberOfTypes + 1})`
        }
      }
      return ""
    }

    const createAttributeSelector = (attributes) => {
      if (this.useXpath && Object.keys(attributes).length) {
        const selector = `[${
          Object.keys(attributes).reduce((acc, attributeName, index) => {
            if (index) acc += " and ";
            return acc += (attributes[attributeName].map((value) => `contains(@${attributeName}, '${value}')`).join(" and "));
          }, "")
        }]`;
        return selector;
      } else {
        let selector = "";
        for (const attributeName in attributes) {
          if (attributeName === "class" && attributes[attributeName].length) {
            selector += `.${attributes[attributeName].join(".")}`;
          } else if (attributeName === "id") {
            selector += `#${attributes[attributeName]}`;
          } else {
            selector += `[${attributeName}='${attributes[attributeName]}']`;
          }
        }
        return selector;
      }
      
    }

    const delimiter = this.useXpath ? "/" : " ";
    const prefix = this.useXpath ? "//" : "";

    const query = this.treeElements.reduce((acc, treeElement) => {
      const element = treeElement.element;
      if (!acc) return element.tagName;
      return `${acc}${delimiter}${element.tagName}${getNthType(element)}${createAttributeSelector(treeElement.attributes)}`
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
    this.lastQueryHighlightedValue = target.value;
    if (!element) return;
    element.dataset.advancedSelectingHover = true;
  }

  hideTargetByQuery() {
      if (this.lastQueryHighlightedValue) {
        const element = this.useXpath ? this._getElementByXPath(this.lastQueryHighlightedValue) : document.querySelector(this.lastQueryHighlightedValue);
        if (!element) return;
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
      ${this.useXpath && this.treeElements.length ?
        html`<button @click="${this.startPicking}" data-pick-type="relative">Pick relative element</button>` : ""
      }
      <input id="query" type="text" value="${this.generateQuery()}" @mouseover="${this.showTargetByQuery}" @mouseout="${this.hideTargetByQuery}">
      <label>Use XPath<input type="checkbox" @click="${() => this.useXpath = !this.useXpath}"></label>
      <ul id="mainVisualTree">
        ${this._renderVisualTree()}
      </ul>
    `;
  }
}

customElements.define("advanced-selecting", AdvancedSelecting);
