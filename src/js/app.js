import { createStore } from 'redux'

const siteActions = function siteActions (type = "start", action) {
  const actionObject = { classActions: { add: [], remove: []} };
  switch (action.type) {
    case 'start':
      actionObject.classActions.remove.push('landing');
      actionObject.classActions.add.push('start');
      break;
    case 'landing':
      actionObject.classActions.remove.push('start');
      actionObject.classActions.add.push('landing');
      break;
  }
  return actionObject;
};

// Create a Redux store holding the state of your app.
// Its API is { subscribe, dispatch, getState }.
let actionStore = createStore(siteActions);

// You can subscribe to the updates manually, or use bindings to your view layer.
actionStore.subscribe(() => {
    const actions = actionStore.getState();
    console.log(actions);

    actions.classActions.add.map((cssClass) => {
      document.querySelector('.viewport').classList.add(cssClass);
    });
    actions.classActions.remove.map((cssClass) => {
      document.querySelector('.viewport').classList.remove(cssClass);
    });
  }
);

window.addEventListener('load', () => {
  "use strict";
  actionStore.dispatch({ type: 'landing' });
});

