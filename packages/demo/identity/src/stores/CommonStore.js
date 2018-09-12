import {
  configure,
  observable,
  action,
  computed,
} from 'mobx';

configure({ enforceActions: 'always' }); // don't allow state modifications outside actions

class CommonStore {
  /* JSDOC: MARK START OBSERVABLE */
  @observable isUser: Boolean = false;
  @observable isOnboardDone: Boolean = true;
  @observable activeOnboardStep: Number = 1; // 1 - 3: Onboarding, 4: Homepage
  @observable currentLanguage: String = 'en';
  @observable currentNetwork: String = 'Main Ethereum Network';
  // true: completed; false: not done;
  @observable setupWalletProgress: Array = [true, true, true, true];
  @observable shouldRenderOnboardTransition: Boolean = false;
  /* JSDOC: MARK END OBSERVABLE */

  constructor(rootStore) {
    this.rootStore = rootStore;
  }

  @computed get isWalletSetupDone() {
    return this.setupWalletProgress.every(progress => (progress)); // check if every step is done
  }

  // @computed get isOnboardDone() {
  //   return this.isOnboardDone
  // }

  /* ************* Getters *************  */
  /**
   * Gets the role of user
   *
   * @returns {Boolean} True if is User, false if is Verifier
   * @memberof CommonStore
   */

  getIsUser() {
    return this.isUser;
  }

  /* ************* Getters *************  */
  /**
   * Gets the status of setup
   *
   * @returns {Boolean} True if done, false otherwise
   * @memberof CommonStore
   */

  getIsOnboardDone() {
    return this.isOnboardDone;
  }

  getShouldRenderOnboardTransition() {
    return this.shouldRenderOnboardTransition;
  }

  getActiveOnboardStep() {
    return this.activeOnboardStep;
  }

  getCurrentLanguage() {
    return this.currentLanguage;
  }

  getCurrentNetwork() {
    return this.currentNetwork;
  }

  getSetupWalletProgress(id) {
    return this.setupWalletProgress[id];
  }
  /**
   * Change role to Verifier
   *
   * @returns {null} null
   * @memberof CommonStore
   */
  @action
  changeToVerifier() {
    this.setTrueShouldRenderOnboardTransition();
    this.isUser = false;
  }

  /**
   * Change role to User
   *
   * @returns {null} null
   * @memberof CommonStore
   */
  @action
  changeToUser() {
    this.setTrueShouldRenderOnboardTransition();
    this.isUser = true;
  }

  @action
  toggleRole() {
    this.isUser = !this.isUser;
    // window.localStorage.setItem('isUser', this.isUser);
  }
  /**
   * Change Setup status to done
   *
   * @returns {null} null
   * @memberof CommonStore
   */
  @action
  finishOnboard() {
    this.isOnboardDone = true;
  }

  @action
  onboardNextStep() {
    this.activeOnboardStep += 1;
  }

  @action
  setCurrentLanguage(l) {
    this.currentLanguage = l;
  }

  @action
  completeSetupWalletProgress(id) {
    this.setupWalletProgress[id] = true;
  }

  @action
  setTrueShouldRenderOnboardTransition() {
    this.shouldRenderOnboardTransition = true;
  }
  @action
  setFalseShouldRenderOnboardTransition() {
    this.shouldRenderOnboardTransition = false;
  }
}

export default CommonStore;
