const SUPABASE_URL = "https://qyfuecdxbtvkrxallbqc.supabase.co";
const SUPABASE_KEY = "sb_publishable_9cuFzb1ZyQl-Ucx2PXXsIQ_ueS3c6oZ";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);
// DARK AND LIGHT MODE
const themeBtn = document.getElementById("themeBtn");

themeBtn.addEventListener("click", function () {
    document.body.classList.toggle("dark");

    if (document.body.classList.contains("dark")) {
        themeBtn.innerHTML = "☀️";
    } else {
        themeBtn.innerHTML = "🌙";
    }
});

emailjs.init({
    publicKey: "dFIHqZHGtj1sAAbFg"
});

// PROPERTY SEARCH
function searchProperties() {

    const location = document.getElementById("location").value.toLowerCase();
    const type = document.getElementById("type").value;
    const price = document.getElementById("price").value;

    const properties = document.querySelectorAll(".property-card");

    let found = 0;

    properties.forEach(function (property) {

        const propertyLocation = property.dataset.location;
        const propertyType = property.dataset.type;
        const propertyPrice = Number(property.dataset.price);

        const locationMatch =
            propertyLocation.includes(location);

        const typeMatch =
            type === "all" || propertyType === type;

        const priceMatch =
            price === "all" || propertyPrice <= Number(price);

        if (locationMatch && typeMatch && priceMatch) {
            property.style.display = "block";
            found++;
        } else {
            property.style.display = "none";
        }

    });

    if (found === 0) {
        alert("No properties found. Try another search!");
    }

}


// PROPERTY DETAILS
function showDetails(name, price, location) {

    document.getElementById("detailName").innerText = name;

    document.getElementById("detailPrice").innerText = price;

    document.getElementById("detailLocation").innerText = location;

    document.getElementById("detailsModal").style.display = "flex";

}


// CLOSE PROPERTY DETAILS
function closeDetails() {

    document.getElementById("detailsModal").style.display = "none";

}


// CLOSE MODAL WHEN CLICKING OUTSIDE
window.addEventListener("click", function(event) {

    const modal = document.getElementById("detailsModal");

    if (event.target === modal) {
        closeDetails();
    }

});


const contactForm = document.getElementById("contactForm");

contactForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    const inputs = contactForm.querySelectorAll("input");
    const message = contactForm.querySelector("textarea");

    const { error } = await supabaseClient
        .from("customer_inquiries")
        .insert([{
            customer_name: inputs[0].value.trim(),
            customer_email: inputs[1].value.trim(),
            subject: inputs[2].value.trim(),
            message: message.value.trim()
        }]);

    if (error) {
        console.error(error);
        alert("Message save nahi hua. Please try again.");
    } else {
    try {
        await emailjs.send(
            "service_4o9kq4n",
            "template_01pojt1",
            {
                customer_name: inputs[0].value.trim(),
                customer_email: inputs[1].value.trim(),
                subject: inputs[2].value.trim(),
                message: message.value.trim()
            }
        );

        alert("Inquiry saved and email sent successfully!");
        contactForm.reset();

    } catch (emailError) {
        console.error(emailError);
        alert("Inquiry saved, but email notification failed.");
        contactForm.reset();
    }
}
});


// SCROLL ANIMATION
const observer = new IntersectionObserver(function(entries) {

    entries.forEach(function(entry) {

        if (entry.isIntersecting) {

            entry.target.classList.add("show");

        }

    });

}, {
    threshold: 0.15
});


document.querySelectorAll(".property-card, .about, .section-heading")
.forEach(function(element) {

    observer.observe(element);

});


// CONSOLE MESSAGE
console.log("Elite Estates Website Loaded Successfully!");
// LOAD PROPERTIES FROM SUPABASE

// LOAD PROPERTIES FROM SUPABASE

async function loadProperties() {

    const propertyGrid = document.getElementById("propertyGrid");

    if (!propertyGrid) return;

    propertyGrid.innerHTML = "<p>Loading properties...</p>";

    const { data, error } = await supabaseClient
        .from("properties")
        .select("*, property_images(image_url)")
        .order("created_at", { ascending: false });

    if (error) {
        console.error(error);
        propertyGrid.textContent = "Unable to load properties.";
        return;
    }

    propertyGrid.innerHTML = "";

    if (!data || data.length === 0) {
        propertyGrid.textContent = "No properties available.";
        return;
    }

    data.forEach(function(property) {

        const card = document.createElement("div");
        card.className = "property-card";

        card.dataset.location = property.location.toLowerCase();
        card.dataset.type = property.property_type;
        card.dataset.price = property.price;

        const images = property.property_images || [];

        const image = document.createElement("img");

        image.src = images.length
            ? images[0].image_url
            : "https://placehold.co/600x400";

        image.alt = property.title;

        const info = document.createElement("div");
        info.className = "card-info";

        const badge = document.createElement("span");
        badge.className = "badge";
        badge.textContent = "For Sale";

        const title = document.createElement("h3");
        title.textContent = property.title;

        const location = document.createElement("p");
        location.textContent = "📍 " + property.location;

        const bottom = document.createElement("div");
        bottom.className = "card-bottom";

        const price = document.createElement("strong");
        price.textContent = "Rs. " +
            Number(property.price).toLocaleString("en-PK");

        const button = document.createElement("button");
        button.textContent = "View Details";

        button.addEventListener("click", function() {
            showDetails(property);
        });

        bottom.appendChild(price);
        bottom.appendChild(button);

        info.appendChild(badge);
        info.appendChild(title);
        info.appendChild(location);
        info.appendChild(bottom);

        card.appendChild(image);
        card.appendChild(info);

        propertyGrid.appendChild(card);

    });

}


// SHOW COMPLETE PROPERTY DETAILS

function showDetails(property) {

    document.getElementById("detailName").textContent =
        property.title || "";

    document.getElementById("detailPrice").textContent =
        "Rs. " + Number(property.price).toLocaleString("en-PK");

    document.getElementById("detailLocation").textContent =
        "📍 " + (property.location || "");

    document.getElementById("detailBedrooms").textContent =
        property.bedrooms ?? 0;

    document.getElementById("detailBathrooms").textContent =
        property.bathrooms ?? 0;

    document.getElementById("detailArea").textContent =
        property.area || "Not specified";

    document.getElementById("detailType").textContent =
        property.property_type || "";

    document.getElementById("detailDescription").textContent =
        property.description || "No description available.";

    // PROPERTY IMAGE GALLERY

    const gallery = document.getElementById("detailGallery");

    gallery.innerHTML = "";

    const images = property.property_images || [];

    images.forEach(function(item) {

        const img = document.createElement("img");

        img.src = item.image_url;
        img.alt = property.title;

        gallery.appendChild(img);

    });

    document.getElementById("detailsModal").style.display = "flex";

}


// CLOSE PROPERTY DETAILS

function closeDetails() {

    document.getElementById("detailsModal").style.display = "none";

}


// START PROPERTY LOADING

document.addEventListener("DOMContentLoaded", function() {
    loadProperties();
});
// SMART BACK BUTTON

const backBtn = document.getElementById("smartBackBtn");

function updateBackButton() {

    const hash = window.location.hash;

    if (hash && hash !== "#home" && hash !== "#") {
        backBtn.style.display = "block";
    } else {
        backBtn.style.display = "none";
    }
}

function smartGoBack() {

    if (window.location.hash === "#properties" ||
        window.location.hash === "#about" ||
        window.location.hash === "#contact") {

        window.location.hash = "#home";

    } else {
        history.back();
    }
}

window.addEventListener("hashchange", updateBackButton);

updateBackButton();