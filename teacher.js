const URL = "https://zvvfjmadziyuwutdresz.supabase.co";
const KEY = "sb_publishable_5tzbKmV1EQZTDFLtRPLhnQ_POvlG0Xc";
const $ = id => document.getElementById(id);

let rows = [];
let qCount = 0;

// ============================================
// دوال مساعدة
// ============================================
async function rpc(fn, body = {}) {
    let r = await fetch(`${URL}/rest/v1/rpc/${fn}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "apikey": KEY,
            "Authorization": "Bearer " + KEY
        },
        body: JSON.stringify(body)
    });
    let t = await r.text();
    if (!r.ok) throw Error(t);
    return t ? JSON.parse(t) : null;
}

function esc(s) {
    return String(s ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    }[c]));
}

function normalize(x) {
    let r = x || {};
    return {
        name: String(r.student_name ?? r.name ?? r.student ?? "غير متاح"),
        exam: String(r.exam_title ?? r.title ?? r.exam ?? "امتحان"),
        score: Number(r.score ?? r.correct ?? r.correct_answers ?? 0),
        total: Number(r.total_questions ?? r.total ?? r.questions_count ?? 0)
    };
}

function percent(x) {
    let n = normalize(x);
    return n.total > 0 ? Math.max(0, Math.min(100, Math.round(n.score / n.total * 100))) : 0;
}

// ============================================
// القائمة الجانبية
// ============================================
function openMenu() {
    $("menu").classList.add("open");
    $("overlay").classList.add("open");
}

function closeMenu() {
    $("menu").classList.remove("open");
    $("overlay").classList.remove("open");
}

$("hamb").onclick = openMenu;
$("close").onclick = closeMenu;
$("overlay").onclick = closeMenu;

// ============================================
// التنقل بين الصفحات
// ============================================
function page(id) {
    document.querySelectorAll(".page").forEach(x => x.classList.add("hidden"));
    $(id).classList.remove("hidden");
    document.querySelectorAll(".nav").forEach(x => x.classList.toggle("active", x.dataset.page === id));
    closeMenu();
    if (id === "results") render();
}

document.querySelectorAll(".nav").forEach(x => x.onclick = () => page(x.dataset.page));
document.querySelectorAll("[data-go]").forEach(x => x.onclick = () => page(x.dataset.go));

// ============================================
// تسجيل الدخول والخروج
// ============================================
$("loginForm").onsubmit = e => {
    e.preventDefault();
    if ($("user").value.trim() === "Hasan" && $("pass").value === "25808") {
        sessionStorage.tc = "1";
        start();
    } else {
        $("err").textContent = "بيانات الدخول غير صحيحة.";
    }
};

$("logout").onclick = () => {
    sessionStorage.removeItem("tc");
    location.reload();
};

$("refresh").onclick = load;
$("refreshTop").onclick = load;
$("search").oninput = render;
$("order").onchange = render;

// ============================================
// عرض النتائج
// ============================================
function resultCard(x, i) {
    let n = normalize(x);
    let p = percent(x);
    let wrong = Math.max(0, n.total - n.score);
    let initial = n.name.trim().charAt(0) || "ط";
    return `<div class="result" data-index="${i}">
        <div class="result-avatar">${esc(initial)}</div>
        <div>
            <div class="name">${esc(n.name)}</div>
            <div class="exam">${esc(n.exam)}</div>
        </div>
        <div class="rstat"><b>${n.score} / ${n.total}</b>إجابات صحيحة</div>
        <div class="rstat"><b>${wrong}</b>إجابات خاطئة</div>
        <div class="rpercent">${p}%</div>
    </div>`;
}

function topCard(x, i) {
    let n = normalize(x);
    let p = percent(x);
    return `<article class="student">
        <div class="rank ${i === 0 ? "one" : ""}">${i + 1}</div>
        <div class="name">${esc(n.name)}</div>
        <div class="exam">${esc(n.exam)}</div>
        <div class="meter"><i style="width:${p}%"></i></div>
        <div class="scoreline"><span>${n.score} من ${n.total}</span><b>${p}%</b></div>
    </article>`;
}

function render() {
    let term = $("search").value.trim().toLowerCase();
    let filtered = rows.filter(x => normalize(x).name.toLowerCase().includes(term));
    filtered.sort((x, y) => $("order").value === "desc" ? percent(y) - percent(x) : percent(x) - percent(y));
    $("resultsList").innerHTML = filtered.length ? filtered.map((x, i) => resultCard(x, i)).join("") :
        `<div class="student">لا توجد نتائج مطابقة.</div>`;
    document.querySelectorAll(".result").forEach(el => {
        el.onclick = () => showDetails(rows[+el.dataset.index]);
    });
}

// ============================================
// تفاصيل الطالب (نافذة منبثقة)
// ============================================
function showDetails(raw) {
    let n = normalize(raw);
    let p = percent(raw);
    let w = Math.max(0, n.total - n.score);
    $("modalName").textContent = n.name;
    $("modalBody").innerHTML = `
        <div class="modal-stat">
            <div><small>الامتحان</small><b>${esc(n.exam)}</b></div>
            <div><small>النسبة</small><b>${p}%</b></div>
            <div><small>الإجابات الصحيحة</small><b>${n.score}</b></div>
            <div><small>الإجابات الخاطئة</small><b>${w}</b></div>
            <div><small>الدرجة</small><b>${n.score} / ${n.total}</b></div>
            <div><small>التقييم</small><b>${p >= 90 ? "ممتاز 🏆" : p >= 75 ? "جيد جداً ⭐" : p >= 50 ? "جيد 👍" : "يحتاج مراجعة 📚"}</b></div>
        </div>
    `;
    $("detailsModal").classList.remove("hidden");
}

// إغلاق النافذة المنبثقة - زر X
$("modalClose").onclick = function() {
    $("detailsModal").classList.add("hidden");
};

// إغلاق النافذة المنبثقة - الضغط خارجها
$("detailsModal").onclick = function(e) {
    if (e.target.id === "detailsModal") {
        $("detailsModal").classList.add("hidden");
    }
};

// ============================================
// تنزيل PDF
// ============================================
$("downloadPdf").onclick = function() {
    if (!rows.length) {
        alert("لا توجد نتائج لتنزيلها.");
        return;
    }
    if (typeof window.jspdf === "undefined") {
        alert("جاري تحميل أداة PDF، حاول مرة أخرى.");
        return;
    }
    let { jsPDF } = window.jspdf;
    let doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    doc.setFont("helvetica");
    doc.setFontSize(20);
    doc.text("Hasan Eissa - Student Results", 40, 45);
    doc.setFontSize(10);
    doc.text(new Date().toLocaleString("en-GB"), 40, 63);
    let data = rows.slice().sort((a, b) => percent(b) - percent(a)).map((x, i) => {
        let n = normalize(x);
        return [i + 1, n.name, n.exam, `${n.score}/${n.total}`, `${Math.max(0, n.total - n.score)}`, `${percent(x)}%`];
    });
    doc.autoTable({
        startY: 80,
        head: [
            ["#", "Student", "Exam", "Score", "Wrong", "Percentage"]
        ],
        body: data,
        theme: "grid",
        styles: { fontSize: 9, cellPadding: 6 },
        headStyles: { fillColor: [22, 70, 110], textColor: 255 }
    });
    doc.save("Hasan-Eissa-Results.pdf");
};

// ============================================
// إضافة سؤال
// ============================================
function addQuestion() {
    qCount++;
    let d = document.createElement("div");
    d.className = "question";
    d.innerHTML = `
        <div class="qbar">
            <b>السؤال ${qCount}</b>
            <button class="remove" onclick="this.closest('.question').remove()">حذف</button>
        </div>
        <label>نص السؤال</label>
        <input class="qt" placeholder="اكتب السؤال هنا">
        <label>الاختيارات — اختر الإجابة الصحيحة</label>
        <div class="opts">
            ${[0,1,2,3].map(i => `
                <div class="opt">
                    <input type="radio" name="correct_${qCount}" value="${i}" ${i === 0 ? "checked" : ""}>
                    <input class="qo" placeholder="الاختيار ${i + 1}">
                </div>
            `).join("")}
        </div>
    `;
    $("questions").appendChild(d);
}

$("addQ").onclick = addQuestion;

// ============================================
// إنشاء امتحان
// ============================================
$("createExam").onclick = async function() {
    try {
        let title = $("examTitle").value.trim() || "امتحان اللغة العربية";
        let duration = +$("duration").value;
        let questions = [...document.querySelectorAll(".question")].map(d => ({
            text: d.querySelector(".qt").value.trim(),
            options: [...d.querySelectorAll(".qo")].map(x => x.value.trim()),
            correct_index: +d.querySelector("input[type=radio]:checked").value
        }));
        if (!duration || !questions.length || questions.some(x => !x.text || x.options.some(v => !v))) {
            throw Error("أكمل بيانات الامتحان والأسئلة.");
        }
        let x = await rpc("create_public_exam", {
            p_title: title,
            p_duration_minutes: duration,
            p_questions: questions
        });
        let code = Array.isArray(x) ? x[0]?.code : x?.code;
        if (!code) throw Error("لم يتم إنشاء الامتحان.");
        $("examLink").value = `${location.origin}${location.pathname.replace(/teacher\.html$/, "index.html")}?exam=${encodeURIComponent(code)}`;
        $("share").classList.remove("hidden");
    } catch (e) {
        alert(e.message);
    }
};

// ============================================
// نسخ الرابط
// ============================================
$("copy").onclick = async function() {
    await navigator.clipboard.writeText($("examLink").value);
    $("copy").textContent = "تم ✓";
    setTimeout(() => $("copy").textContent = "نسخ", 1200);
};

// ============================================
// تحميل البيانات
// ============================================
async function load() {
    try {
        let x = await rpc("teacher_public_results");
        rows = Array.isArray(x) ? x : [];
        let ps = rows.map(percent);
        let avg = ps.length ? Math.round(ps.reduce((a, b) => a + b, 0) / ps.length) : 0;
        let best = ps.length ? Math.max(...ps) : 0;
        let bi = ps.findIndex(x => x === best);
        $("total").textContent = rows.length;
        $("count").textContent = rows.length;
        $("avg").textContent = avg + "%";
        $("high").textContent = best + "%";
        $("highName").textContent = bi >= 0 ? normalize(rows[bi]).name : "—";
        let sorted = rows.slice().sort((a, b) => percent(b) - percent(a));
        $("topStudents").innerHTML = sorted.slice(0, 3).map((x, i) => topCard(x, i)).join("") ||
            `<div class="student">لا توجد نتائج حتى الآن.</div>`;
        render();
    } catch (e) {
        console.error(e);
        $("topStudents").innerHTML = `<div class="student">تعذر تحميل النتائج من الخادم.</div>`;
    }
}

// ============================================
// بدء التشغيل
// ============================================
function start() {
    $("login").classList.add("hidden");
    $("app").classList.remove("hidden");
    if (!document.querySelector(".question")) addQuestion();
    load();
}

if (sessionStorage.tc === "1") start();