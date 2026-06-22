console.log("🌙 TerSpegelt App gestart");

// 🌍 Firebase references (from window)
const db = window.db;
const { collection, addDoc, getDocs } = window.firebaseModules;

// 📅 UI elements
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

// ➕ POST NAAR FIREBASE
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

        loadPosts(); // refresh timeline
    } catch (e) {
        console.error("Fout bij opslaan:", e);
    }
});

// ⏰ time sorter (09:00 → number)
function timeToNumber(time) {
    const [h, m] = time.split(":");
    return parseInt(h) * 60 + parseInt(m);
}

// 📥 LOAD POSTS FROM FIREBASE
async function loadPosts() {

    feed.innerHTML = "";

    const snapshot = await getDocs(collection(db, "posts"));

    let posts = [];

    snapshot.forEach(doc => {
        posts.push(doc.data());
    });

    // 📅 group by day
    let days = {};

    posts.forEach(post => {
        if (!days[post.dag]) {
            days[post.dag] = [];
        }
        days[post.dag].push(post);
    });

    // 📜 render days
    Object.keys(days)
        .sort((a, b) => a - b)
        .forEach(day => {

            const dayDiv = document.createElement("div");
            dayDiv.className = "day";

            const title = document.createElement("h2");
            title.innerText = "Dag " + day;

            dayDiv.appendChild(title);

            // ⏰ sort by time
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
                    `;

                    dayDiv.appendChild(postDiv);
                });

            feed.appendChild(dayDiv);
        });
}

// 🚀 start app
loadPosts();
