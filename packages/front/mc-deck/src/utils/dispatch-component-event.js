export function dispatchComponentEvent(element, name, detail) {
    element.dispatchEvent(new CustomEvent(name, {
        detail,
        bubbles: true,
        composed: true,
    }));
}
