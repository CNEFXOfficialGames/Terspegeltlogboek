console.log("🌙 TerSpegelt App gestart");

// =========================
// 🛡️ SAFETY CHECK (IMPORTANT)
// =========================
if (!window.db || !window.firebaseModules) {
    console.error("❌ Firebase is not loaded correctly!");
    console.log("db:", window.db);
    console.log("firebaseModules:", window.firebaseModules);
}

// 🌍 Firebase
const db = window.db;

// ⚠️ SAFE DESTRUCTURING (prevents crash)
const firebase = window.firebaseModules || {};

const {
    collection,
    addDoc,
    getDocs,
    doc,
    deleteDoc,
    updateDoc
} = firebase;

// 📅 UI (wait until DOM exists safely)
document.addEventListener("DOMContentLoaded", () => {

    const feed = document.getElementById("feed");
    const popup = document.getElementById("postPopup");

    const openBtn = document.getElementById("nieuwePostKnop");
    const closeBtn = document.getElementById("sluitKnop");
    const placeBtn = document.getElementById("plaatsKnop");

    // =========================
    // 🪟 POPUP
    // =========================
    openBtn.addEventListener("click", () => {
        popup.style.display = "block";
    });

    closeBtn.addEventListener("click", () => {
        popup.style.display = "none";
    });

    // =========================
    // ➕ CREATE POST
    // =========================
    placeBtn.addEventListener("click", async () => {

        const naam = document.getElementById("naam").value;
        const dag = document.getElementById("dag").value;
        const tijd = document.getElementById("tijd").value;
        const categorie = document.getElementById("categorie").value;
        const beschrijving = document.getElementById("beschrijving").value;

        if (!naam || !dag || !tijd || !beschrijving) {
            alert("Vul alles in!");
            return;
        }

        try {
            await addDoc(collection(db, "posts"), {
                naam,
                dag,
                tijd,
                categorie,
                beschrijving,
                createdAt: Date.now()
            });

            popup.style.display = "none";

            document.getElementById("naam").value = "";
            document.getElementById("tijd").value = "";
            document.getElementById("beschrijving").value = "";

            loadPosts();

        } catch (e) {
            console.error("❌ Fout bij opslaan:", e);
        }
    });

    // =========================
    // ⏰ TIME CONVERT
    // =========================
    function timeToNumber(time) {
        const [h, m] = time.split(":");
        return parseInt(h) * 60 + parseInt(m);
    }

    // =========================
    // 🗑️ DELETE POST
    // =========================
    window.deletePost = async function (id) {
        try {
            await deleteDoc(doc(db, "posts", id));
            loadPosts();
        } catch (e) {
            console.error(e);
        }
    };

    // =========================
    // ✏️ EDIT POST
    // =========================
    window.editPost = async function (id, oldText) {

        const newText = prompt("Edit post:", oldText);

        if (!newText) return;

        try {
            await updateDoc(doc(db, "posts", id), {
                beschrijving: newText
            });

            loadPosts();
        } catch (e) {
            console.error(e);
        }
    };

    // =========================
    // 📥 LOAD POSTS
    // =========================
    async function loadPosts() {

        if (!db || !collection) return;

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
});
