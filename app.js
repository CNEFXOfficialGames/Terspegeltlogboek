console.log("🌙 TerSpegelt App gestart");

// 🌍 Firebase
const db = window.db;
const storage = window.storage; // 🔥 ADD THIS

const { 
    collection, 
    addDoc, 
    getDocs, 
    doc, 
    deleteDoc, 
    updateDoc,
    ref,
    uploadBytes,
    getDownloadURL
} = window.firebaseModules;

// 📅 UI
const feed = document.getElementById("feed");
const popup = document.getElementById("postPopup");

const openBtn = document.getElementById("nieuwePostKnop");
const closeBtn = document.getElementById("sluitKnop");
const placeBtn = document.getElementById("plaatsKnop");

// 🪟 popup open/close
openBtn.addEventListener("click", () => {
    popup.style.display = "block";
});

closeBtn.addEventListener("click", () => {
    popup.style.display = "none";
});

// ➕ CREATE POST (FIREBASE + IMAGE)
placeBtn.addEventListener("click", async () => {

    const naam = document.getElementById("naam").value;
    const dag = document.getElementById("dag").value;
    const tijd = document.getElementById("tijd").value;
    const categorie = document.getElementById("categorie").value;
    const beschrijving = document.getElementById("beschrijving").value;
    const fileInput = document.getElementById("fotos");

    if (!naam || !dag || !tijd || !beschrijving) {
        alert("Vul alles in!");
        return;
    }

    try {

        let imageUrl = "";

        // 📸 UPLOAD IMAGE IF EXISTS
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];

            const imageRef = ref(storage, "posts/" + Date.now() + "_" + file.name);

            const snapshot = await uploadBytes(imageRef, file);

            imageUrl = await getDownloadURL(snapshot.ref);
        }

        // 💾 SAVE POST
        await addDoc(collection(db, "posts"), {
            naam,
            dag,
            tijd,
            categorie,
            beschrijving,
            imageUrl,
            createdAt: Date.now()
        });

        popup.style.display = "none";

        document.getElementById("naam").value = "";
        document.getElementById("tijd").value = "";
        document.getElementById("beschrijving").value = "";
        fileInput.value = "";

        loadPosts();

    } catch (e) {
        console.error("Fout bij opslaan:", e);
    }
});

// ⏰ time → number
function timeToNumber(time) {
    const [h, m] = time.split(":");
    return parseInt(h) * 60 + parseInt(m);
}

// 🗑️ DELETE POST
async function deletePost(id) {
    await deleteDoc(doc(db, "posts", id));
    loadPosts();
}

// ✏️ EDIT POST
async function editPost(id, oldText) {
    const newText = prompt("Edit post:", oldText);

    if (!newText) return;

    await updateDoc(doc(db, "posts", id), {
        beschrijving: newText
    });

    loadPosts();
}

// 📥 LOAD + RENDER TIMELINE
async function loadPosts() {

    feed.innerHTML = "";

    const snapshot = await getDocs(collection(db, "posts"));

    let posts = [];

    snapshot.forEach(docSnap => {
        posts.push({
            id: docSnap.id,
            ...docSnap.data()
        });
    });

    let days = {};

    posts.forEach(post => {
        if (!days[post.dag]) {
            days[post.dag] = [];
        }
        days[post.dag].push(post);
    });

    Object.keys(days)
        .sort((a, b) => a - b)
        .forEach(day => {

            const dayDiv = document.createElement("div");
            dayDiv.className = "day";

            const title = document.createElement("h2");
            title.innerText = "Dag " + day;

            dayDiv.appendChild(title);

            days[day]
                .sort((a, b) => timeToNumber(a.tijd) - timeToNumber(b.tijd))
                .forEach(post => {

                    const postDiv = document.createElement("div");
                    postDiv.className = "post";

                    postDiv.innerHTML = `
                        <div class="time-label">${post.tijd}</div>
                        <div class="naam">${post.naam}</div>

                        <div class="tag ${post.categorie}">
                            ${post.categorie}
                        </div>

                        <p>${post.beschrijving}</p>

                        ${post.imageUrl ? `
                            <img src="${post.imageUrl}" style="width:100%; border-radius:12px; margin-top:10px;">
                        ` : ""}

                        <button onclick="editPost('${post.id}', \`${post.beschrijving}\`)">✏️</button>
                        <button onclick="deletePost('${post.id}')">🗑️</button>
                    `;

                    dayDiv.appendChild(postDiv);
                });

            feed.appendChild(dayDiv);
        });
}

// 🌙 START APP
loadPosts();
