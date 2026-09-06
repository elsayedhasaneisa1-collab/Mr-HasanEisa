// ================================================
// 1. الإعدادات الأساسية والمتغيرات
// ================================================

const URL = "https://zvvfjmadziyuwutdresz.supabase.co";
const KEY = "sb_publishable_5tzbKmV1EQZTDFLtRPLhnQ_POvlG0Xc";
const $ = id => document.getElementById(id); // اختصار لـ document.getElementById

let rows = [];      // تخزين نتائج الطلاب
let qCount = 0;     // عداد الأسئلة


// ================================================
// 2. دالة الاتصال بـ Supabase (RPC)
// ================================================

async function rpc(fn, body = {}) {
    // fn: اسم الدالة في Supabase
    // body: المعاملات المرسلة
    
    let response = await fetch(`${URL}/rest/v1/rpc/${fn}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "apikey": KEY,
            "Authorization": "Bearer " + KEY
        },
        body: JSON.stringify(body)
    });
    
    let text = await response.text();
    if (!response.ok) throw Error(text);
    return text ? JSON.parse(text) : null;
}


// ================================================
// 3. دوال مساعدة (تنظيف النصوص - حساب النسب)
// ================================================

// دالة لتأمين النصوص من هجمات XSS
function esc(s) {
    return String(s ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    }[c]));
}

// دالة لتطبيع بيانات الطالب (تأكد من وجود كل الحقول)
function normalize(x) {
    let r = x || {};
    return {
        name: String(r.student_name ?? r.name ?? r.student ?? "غير متاح"),
        exam: String(r.exam_title ?? r.title ?? r.exam ?? "امتحان"),
        score: Number(r.score ?? r.correct ?? r.correct_answers ?? 0),
        total: Number(r.total_questions ?? r.total ?? r.questions_count ?? 0)
    };
}

// دالة لحساب النسبة المئوية
function percent(x) {
    let n = normalize(x);
    return n.total > 0 ? Math.max(0, Math.min(100, Math.round(n.score / n.total * 100))) : 0;
}


// ================================================
// 4. القائمة الجانبية (فتح - إغلاق)
// ================================================

function openMenu() {
    $("menu").classList.add("open");
    $("overlay").classList.add("open");
}

function closeMenu() {
    $("menu").classList.remove("open");
    $("overlay").classList.remove("open");
}

$("hamb").onclick = openMenu;   // زر فتح القائمة
$("close").onclick = closeMenu; // زر إغلاق القائمة
$("overlay").onclick = closeMenu; // الضغط خارج القائمة


// ================================================
// 5. التنقل بين الصفحات
// ================================================

function page(id) {
    // إخفاء كل الصفحات
    document.querySelectorAll(".page").forEach(x => x.classList.add("hidden"));
    // إظهار الصفحة المطلوبة
    $(id).classList.remove("hidden");
    // تفعيل الزر المناسب في القائمة
    document.querySelectorAll(".nav").forEach(x => x.classList.toggle("active", x.dataset.page === id));
    // إغلاق القائمة
    closeMenu();
    // إذا كانت صفحة النتائج، نقوم بتحديثها
    if (id === "results") render();
}

// أزرار القائمة
document.querySelectorAll(".nav").forEach(x => x.onclick = () => page(x.dataset.page));
// أزرار "اذهب إلى" (مثل زر امتحان جديد)
document.querySelectorAll("[data-go]").forEach(x => x.onclick = () => page(x.dataset.go));


// ================================================
// 6. تسجيل الدخول والخروج
// ================================================

$("loginForm").onsubmit = function(e) {
    e.preventDefault();
    if ($("user").value.trim() === "Hasan" && $("pass").value === "25808") {
        sessionStorage.tc = "1"; // حفظ حالة تسجيل الدخول
        start(); // بدء التطبيق
    } else {
        $("err").textContent = "بيانات الدخول غير صحيحة.";
    }
};

$("logout").onclick = function() {
    sessionStorage.removeItem("tc");
    location.reload();
};


// ================================================
// 7. تحديث البيانات
// ================================================

$("refresh").onclick = load;
$("refreshTop").onclick = load;
$("search").oninput = render; // عند الكتابة في البحث
$("order").onchange = render; // عند تغيير الترتيب


// ================================================
// 8. عرض بطاقات النتائج
// ================================================

// بطاقة نتيجة في صفحة النتائج
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

// بطاقة طالب في المتفوقين
function topCard(x, i) {
    let n = normalize(x);
    let p = percent(x);
    
    return `<article class="student">
        <div class="rank ${i === 0 ? "one" : ""}">${i + 1}</div>
        <div class="name">${esc(n.name)}</div>
        <div class="exam">${esc(n.exam)}</div>
        <div class="meter"><i style="width:${p}%"></i></div>
        <div class="scoreline">
            <span>${n.score} من ${n.total}</span>
            <b>${p}%</b>
        </div>
    </article>`;
}

// دالة العرض والتصفية والترتيب
function render() {
    let term = $("search").value.trim().toLowerCase();
    
    // تصفية حسب البحث
    let filtered = rows.filter(x => normalize(x).name.toLowerCase().includes(term));
    
    // ترتيب حسب الاختيار
    filtered.sort((x, y) => 
        $("order").value === "desc" ? percent(y) - percent(x) : percent(x) - percent(y)
    );
    
    // عرض النتائج
    $("resultsList").innerHTML = filtered.length 
        ? filtered.map((x, i) => resultCard(x, i)).join("")
        : `<div class="student">لا توجد نتائج مطابقة.</div>`;
    
    // إضافة حدث النقر على كل نتيجة لعرض التفاصيل
    document.querySelectorAll(".result").forEach(el => {
        el.onclick = () => showDetails(rows[+el.dataset.index]);
    });
}


// ================================================
// 9. نافذة تفاصيل الطالب
// ================================================

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
            <div><small>التقييم</small><b>${
                p >= 90 ? "ممتاز 🏆" :
                p >= 75 ? "جيد جداً ⭐" :
                p >= 50 ? "جيد 👍" : "يحتاج مراجعة 📚"
            }</b></div>
        </div>
    `;
    $("detailsModal").classList.remove("hidden");
}

// زر إغلاق النافذة (X)
$("modalClose").onclick = function() {
    $("detailsModal").classList.add("hidden");
};

// إغلاق النافذة بالضغط خارجها
$("detailsModal").onclick = function(e) {
    if (e.target.id === "detailsModal") {
        $("detailsModal").classList.add("hidden");
    }
};


// ================================================
// 10. تنزيل PDF
// ================================================

$("downloadPdf").onclick = function() {
    // التأكد من وجود نتائج
    if (!rows.length) {
        alert("لا توجد نتائج لتنزيلها.");
        return;
    }
    
    // التأكد من تحميل مكتبة PDF
    if (typeof window.jspdf === "undefined") {
        alert("جاري تحميل أداة PDF، حاول مرة أخرى.");
        return;
    }
    
    let { jsPDF } = window.jspdf;
    let doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    
    // العنوان
    doc.setFont("helvetica");
    doc.setFontSize(20);
    doc.text("Hasan Eissa - Student Results", 40, 45);
    
    // التاريخ
    doc.setFontSize(10);
    doc.text(new Date().toLocaleString("en-GB"), 40, 63);
    
    // البيانات
    let data = rows.slice()
        .sort((a, b) => percent(b) - percent(a))
        .map((x, i) => {
            let n = normalize(x);
            return [
                i + 1,
                n.name,
                n.exam,
                `${n.score}/${n.total}`,
                `${Math.max(0, n.total - n.score)}`,
                `${percent(x)}%`
            ];
        });
    
    // الجدول
    doc.autoTable({
        startY: 80,
        head: [["#", "Student", "Exam", "Score", "Wrong", "Percentage"]],
        body: data,
        theme: "grid",
        styles: { fontSize: 9, cellPadding: 6 },
        headStyles: { fillColor: [22, 70, 110], textColor: 255 }
    });
    
    // حفظ الملف
    doc.save("Hasan-Eissa-Results.pdf");
};


// ================================================
// 11. إضافة سؤال
// ================================================

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


// ================================================
// 12. إنشاء امتحان
// ================================================

$("createExam").onclick = async function() {
    try {
        // جمع البيانات
        let title = $("examTitle").value.trim() || "امتحان اللغة العربية";
        let duration = +$("duration").value;
        
        let questions = [...document.querySelectorAll(".question")].map(d => ({
            text: d.querySelector(".qt").value.trim(),
            options: [...d.querySelectorAll(".qo")].map(x => x.value.trim()),
            correct_index: +d.querySelector("input[type=radio]:checked").value
        }));
        
        // التحقق من صحة البيانات
        if (!duration || !questions.length || questions.some(x => !x.text || x.options.some(v => !v))) {
            throw Error("أكمل بيانات الامتحان والأسئلة.");
        }
        
        // إرسال إلى Supabase
        let result = await rpc("create_public_exam", {
            p_title: title,
            p_duration_minutes: duration,
            p_questions: questions
        });
        
        let code = Array.isArray(result) ? result[0]?.code : result?.code;
        if (!code) throw Error("لم يتم إنشاء الامتحان.");
        
        // عرض الرابط
        $("examLink").value = `${location.origin}${location.pathname.replace(/teacher\.html$/, "index.html")}?exam=${encodeURIComponent(code)}`;
        $("share").classList.remove("hidden");
        
    } catch (e) {
        alert(e.message);
    }
};


// ================================================
// 13. نسخ الرابط
// ================================================

$("copy").onclick = async function() {
    await navigator.clipboard.writeText($("examLink").value);
    $("copy").textContent = "تم ✓";
    setTimeout(() => $("copy").textContent = "نسخ", 1200);
};


// ================================================
// 14. تحميل البيانات من Supabase
// ================================================

async function load() {
    try {
        let result = await rpc("teacher_public_results");
        rows = Array.isArray(result) ? result : [];
        
        // حساب الإحصائيات
        let ps = rows.map(percent);
        let avg = ps.length ? Math.round(ps.reduce((a, b) => a + b, 0) / ps.length) : 0;
        let best = ps.length ? Math.max(...ps) : 0;
        let bestIndex = ps.findIndex(x => x === best);
        
        // تحديث الإحصائيات في الواجهة
        $("total").textContent = rows.length;
        $("count").textContent = rows.length;
        $("avg").textContent = avg + "%";
        $("high").textContent = best + "%";
        $("highName").textContent = bestIndex >= 0 ? normalize(rows[bestIndex]).name : "—";
        
        // عرض أفضل 3 طلاب
        let sorted = rows.slice().sort((a, b) => percent(b) - percent(a));
        $("topStudents").innerHTML = sorted.slice(0, 3).map((x, i) => topCard(x, i)).join("") ||
            `<div class="student">لا توجد نتائج حتى الآن.</div>`;
        
        // عرض كل النتائج
        render();
        
    } catch (e) {
        console.error(e);
        $("topStudents").innerHTML = `<div class="student">تعذر تحميل النتائج من الخادم.</div>`;
    }
}


// ================================================
// 15. بدء التشغيل
// ================================================

function start() {
    $("login").classList.add("hidden");
    $("app").classList.remove("hidden");
    
    // إضافة سؤال افتراضي إذا لم يكن موجود
    if (!document.querySelector(".question")) addQuestion();
    
    load(); // تحميل البيانات
}

// التحقق من حالة تسجيل الدخول
if (sessionStorage.tc === "1") start();