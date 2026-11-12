const SUPABASE_URL = "https:// qyfuecdxbtvkrxallbqc.supabase.co";
const SUPABASE_KEY = "sb_publishable_9cuFzb1ZyQl-Ucx2PXXsIQ_ueS3c6oZ";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

const resetForm = document.getElementById("resetForm");
const message = document.getElementById("message");

resetForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (newPassword !== confirmPassword) {
        message.textContent = "Passwords do not match!";
        return;
    }

    message.textContent = "Updating password...";

    const { error } = await supabaseClient.auth.updateUser({
        password: newPassword
    });

    if (error) {
        message.textContent = error.message;
        return;
    }

    message.textContent = "Password updated successfully!";

    await supabaseClient.auth.signOut();

    setTimeout(function() {
        window.location.href = "admin.html";
    }, 2000);
});