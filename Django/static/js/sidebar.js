document.addEventListener("DOMContentLoaded", () => {
    const sidebar = document.getElementById("dashboardSidebar");
    const toggle = document.getElementById("sidebarToggle");

    if(!sidebar || !toggle){ return; }

    toggle.addEventListener("click", () => {
        const collapsed = sidebar.classList.toggle("collapsed");

        toggle.setAttribute("aria-expanded", String(!collapsed));
        toggle.setAttribute("aria-label", collapsed ? "Expand sidebar" : "Collapse sidebar");
    });
});