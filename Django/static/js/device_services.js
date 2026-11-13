// DEVICE SERVICES (TABLE)
import * as DeviceNavigation from './computer_navigation.js';




document.addEventListener("DOMContentLoaded", () => {
    DeviceNavigation.ComputerNavigation.initialize(async (hostname) => {
        await LoadServices(hostname);
    });
});