// Supabase Connection
const SUPABASE_URL = "https://qyfuecdxbtvkrxallbqc.supabase.co";
const SUPABASE_KEY = "sb_publishable_9cuFzb1ZyQl-Ucx2PXXsIQ_ueS3c6oZ";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

// Login Elements
const loginForm = document.getElementById("adminLoginForm");
const loginMessage = document.getElementById("loginMessage");

// Admin Login
loginForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    const email = document.getElementById("adminEmail").value;
    const password = document.getElementById("adminPassword").value;

    loginMessage.style.color = "blue";
    loginMessage.textContent = "Logging in...";

    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) {
        loginMessage.style.color = "red";
        loginMessage.textContent = error.message;
        return;
    }

    // Check Admin Permission
    const { error: accessError } = await supabaseClient
        .from("customer_inquiries")
        .select("id")
        .limit(1);

    if (accessError) {
        await supabaseClient.auth.signOut();

        loginMessage.style.color = "red";
        loginMessage.textContent = "You are not authorized as admin.";
        return;
    }

    window.location.href = "admin-dashboard.html";
});