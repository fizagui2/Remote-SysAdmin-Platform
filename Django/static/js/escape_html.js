/* >> ESCAPE TEXT BEFORE PUTTING IT INTO innerHTML */
// Everything an agent reports (hostnames, process names, service names...) is untrusted,
// so it has to go through this before it is placed in an HTML string or an attribute.
export function escapeHTML(value){
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&":"&amp;",
        "<":"&lt;",
        ">":"&gt;",
        '"':"&quot;",
        "'":"&#39;"
    })[char]);
}
