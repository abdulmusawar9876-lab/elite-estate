// Supabase Connection
const SUPABASE_URL = "https://qyfuecdxbtvkrxallbqc.supabase.co";
const SUPABASE_KEY = "sb_publishable_9cuFzb1ZyQl-Ucx2PXXsIQ_ueS3c6oZ";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);
supabaseClient.auth.getUser().then(({ data, error }) => {
    console.log("Admin UID:", data.user?.id);
    console.log("Admin Email:", data.user?.email);
    console.log("Auth Error:", error);
});

// Check Admin Login
async function checkAdmin() {

    const { data, error } = await supabaseClient.auth.getSession();

    if (error || !data.session) {
        window.location.href = "admin.html";
        return false;
    }

    return true;
}


// Load Customer Inquiries
async function loadInquiries() {

    const isAdmin = await checkAdmin();

    if (!isAdmin) return;

    const { data, error } = await supabaseClient
        .from("customer_inquiries")
        .select("*")
        .order("created_at", { ascending: false });

    const table = document.getElementById("inquiriesTable");

    if (error) {
        table.innerHTML = `
            <tr>
                <td colspan="5">Error loading inquiries.</td>
            </tr>
        `;
        return;
    }

    document.getElementById("totalInquiries").textContent = data.length;

    document.getElementById("latestInquiries").textContent =
        Math.min(data.length, 5);

    table.innerHTML = "";

    if (data.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="5">No inquiries found.</td>
            </tr>
        `;
        return;
    }

    data.forEach(function(inquiry) {

        const row = document.createElement("tr");

        const values = [
            inquiry.customer_name,
            inquiry.customer_email,
            inquiry.subject,
            inquiry.message,
            new Date(inquiry.created_at).toLocaleString()
        ];

        values.forEach(function(value) {
            const cell = document.createElement("td");
            cell.textContent = value || "";
            row.appendChild(cell);
        });

        table.appendChild(row);
    });
}


// Add New Property With Multiple Images
document.getElementById("propertyForm").addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();

        const isAdmin = await checkAdmin();

        if (!isAdmin) return;

        const button = document.getElementById("publishPropertyBtn");
        const message = document.getElementById("propertyMessage");

        const files = Array.from(
            document.getElementById("propertyImages").files
        );

        // Minimum 2 images
        if (files.length < 2) {
            message.textContent = "Please select at least 2 images.";
            message.style.color = "red";
            return;
        }

        // Check image types
        if (!files.every(file => file.type.startsWith("image/"))) {
            message.textContent = "Please select image files only.";
            message.style.color = "red";
            return;
        }

        const property = {
            title: document.getElementById("propertyTitle").value.trim(),
            price: Number(document.getElementById("propertyPrice").value),
            location: document.getElementById("propertyLocation").value.trim(),
            property_type: document.getElementById("propertyType").value,
            bedrooms: Number(document.getElementById("propertyBedrooms").value),
            bathrooms: Number(document.getElementById("propertyBathrooms").value),
            area: document.getElementById("propertyArea").value.trim(),
            description: document.getElementById("propertyDescription").value.trim()
        };

        if (
            !property.title ||
            !property.price ||
            property.price <= 0 ||
            !property.location ||
            !property.property_type
        ) {
            message.textContent = "Please fill all required fields correctly.";
            message.style.color = "red";
            return;
        }

        button.disabled = true;
        button.textContent = "Publishing...";
        message.textContent = "Please wait, uploading property and images...";

        let propertyId = null;
        let uploadedPaths = [];

        try {

            // Step 1: Save property
            const { data: propertyData, error: propertyError } =
                await supabaseClient
                    .from("properties")
                    .insert([property])
                    .select()
                    .single();

            if (propertyError) throw propertyError;

            propertyId = propertyData.id;


            // Step 2: Upload all images
            const imageRecords = [];

            for (const file of files) {

                const extension = file.name.split(".").pop().toLowerCase();

                const filePath =
                    `${propertyId}/${crypto.randomUUID()}.${extension}`;

                const { error: uploadError } = await supabaseClient
                    .storage
                    .from("property-images")
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                uploadedPaths.push(filePath);

                // Get public image URL
                const { data: urlData } = supabaseClient
                    .storage
                    .from("property-images")
                    .getPublicUrl(filePath);

                imageRecords.push({
                    property_id: propertyId,
                    image_url: urlData.publicUrl
                });
            }


            // Step 3: Save image URLs in database
            const { error: imageError } = await supabaseClient
                .from("property_images")
                .insert(imageRecords);

            if (imageError) throw imageError;


            // Success
            message.textContent = "Property published successfully!";
            message.style.color = "green";

            document.getElementById("propertyForm").reset();

        } catch (error) {

            console.error("Property Upload Error:", error);

            // Clean up incomplete upload
            if (uploadedPaths.length > 0) {

                await supabaseClient
                    .storage
                    .from("property-images")
                    .remove(uploadedPaths);
            }

            if (propertyId !== null) {

                await supabaseClient
                    .from("properties")
                    .delete()
                    .eq("id", propertyId);
            }

            message.textContent =
                "Upload failed: " + error.message;

            message.style.color = "red";

        } finally {

            button.disabled = false;
            button.textContent = "Publish Property";
        }
    }
);


// Logout
document.getElementById("logoutBtn").addEventListener(
    "click",
    async function() {

        await supabaseClient.auth.signOut();

        window.location.href = "admin.html";
    }
);


// Start Dashboard
loadInquiries();
// LOAD ALL PROPERTIES IN ADMIN DASHBOARD

async function loadAdminProperties() {

    const table = document.getElementById("propertiesTable");

    if (!table) return;

    table.innerHTML = `
        <tr><td colspan="6">Loading properties...</td></tr>
    `;

    const { data, error } = await supabaseClient
        .from("properties")
        .select("*, property_images(image_url)")
        .order("created_at", { ascending: false });

    if (error) {
        console.error(error);
        table.innerHTML = `
            <tr><td colspan="6">Error loading properties.</td></tr>
        `;
        return;
    }

    table.innerHTML = "";

    if (!data || data.length === 0) {
        table.innerHTML = `
            <tr><td colspan="6">No properties found.</td></tr>
        `;
        return;
    }

    data.forEach(property => {

        const row = document.createElement("tr");

        const image = document.createElement("img");

        image.src = property.property_images?.[0]?.image_url ||
            "https://placehold.co/80x60";

        image.style.width = "70px";

        const imageCell = document.createElement("td");
        imageCell.appendChild(image);

        const title = document.createElement("td");
        title.textContent = property.title;

        const price = document.createElement("td");
        price.textContent = "Rs. " + property.price;

        const location = document.createElement("td");
        location.textContent = property.location;

        const type = document.createElement("td");
        type.textContent = property.property_type;

        const actions = document.createElement("td");

        const editBtn = document.createElement("button");
        editBtn.textContent = "Edit";

        editBtn.onclick = () => editProperty(property);

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Delete";
        deleteBtn.style.background = "red";
        deleteBtn.style.color = "white";

        deleteBtn.onclick = () => deleteProperty(property.id);

        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);

        row.appendChild(imageCell);
        row.appendChild(title);
        row.appendChild(price);
        row.appendChild(location);
        row.appendChild(type);
        row.appendChild(actions);

        table.appendChild(row);

    });
}


// EDIT PROPERTY

async function editProperty(property) {

    const title = prompt("Property Title:", property.title);
    if (title === null) return;

    const price = prompt("Property Price:", property.price);
    if (price === null) return;

    const location = prompt("Property Location:", property.location);
    if (location === null) return;

    const bedrooms = prompt("Bedrooms:", property.bedrooms ?? 0);
    if (bedrooms === null) return;

    const bathrooms = prompt("Bathrooms:", property.bathrooms ?? 0);
    if (bathrooms === null) return;

    const area = prompt("Area:", property.area || "");
    if (area === null) return;

    const description = prompt(
        "Description:",
        property.description || ""
    );
    if (description === null) return;

    if (!title.trim() || !location.trim() ||
        !Number.isFinite(Number(price)) || Number(price) <= 0 ||
        !Number.isInteger(Number(bedrooms)) || Number(bedrooms) < 0 ||
        !Number.isInteger(Number(bathrooms)) || Number(bathrooms) < 0) {
        alert("Please enter valid property information.");
        return;
    }

    const { error } = await supabaseClient
        .from("properties")
        .update({
            title: title.trim(),
            price: Number(price),
            location: location.trim(),
            bedrooms: Number(bedrooms),
            bathrooms: Number(bathrooms),
            area: area.trim(),
            description: description.trim()
        })
        .eq("id", property.id);

    if (error) {
        alert("Update failed: " + error.message);
        return;
    }

    alert("Property updated successfully!");

    loadAdminProperties();
}


// DELETE PROPERTY

async function deleteProperty(id) {

    const confirmDelete = confirm(
        "Are you sure you want to delete this property?"
    );

    if (!confirmDelete) return;

    const { error } = await supabaseClient
        .from("properties")
        .delete()
        .eq("id", id);

    if (error) {
        alert("Delete failed: " + error.message);
        return;
    }

    alert("Property deleted successfully!");

    loadAdminProperties();
}


// START PROPERTY MANAGEMENT

loadAdminProperties();