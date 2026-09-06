const URL="https://zvvfjmadziyuwutdresz.supabase.co",KEY="sb_publishable_5tzbKmV1EQZTDFLtRPLhnQ_POvlG0Xc";const $=x=>document.getElementById(x);let rows=[],q=0;
async function rpc(fn,body={}){let r=await fetch(`${URL}/rest/v1/rpc/${fn}`,{method:"POST",headers:{"Content-Type":"application/json","apikey":KEY,"Authorization":"Bearer "+KEY},body:JSON.stringify(body)});let t=await r.text();if(!r.ok)throw Error(t);return t?JSON.parse(t):null}
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));function N(x){let r=x||{};return{name:String(r.student_name??r.name??r.student??"اسم الطالب غير متاح"),exam:String(r.exam_title??r.title??r.exam??"امتحان"),score:Number(r.score??r.correct??r.correct_answers??0),total:Number(r.total_questions??r.total??r.questions_count??0)}}function P(x){let n=N(x);return n.total>0?Math.max(0,Math.min(100,Math.round(n.score/n.total*100))):0}
function openMenu(){ $("menu").classList.add("open");$("overlay").classList.add("open")}function closeMenu(){$("menu").classList.remove("open");$("overlay").classList.remove("open")}$("hamb").onclick=openMenu;$("close").onclick=closeMenu;$("overlay").onclick=closeMenu;
function page(id){document.querySelectorAll(".page").forEach(x=>x.classList.add("hidden"));$(id).classList.remove("hidden");document.querySelectorAll(".nav").forEach(x=>x.classList.toggle("active",x.dataset.page===id));closeMenu();if(id==="results")render()}
document.querySelectorAll(".nav").forEach(x=>x.onclick=()=>page(x.dataset.page));document.querySelectorAll("[data-go]").forEach(x=>x.onclick=()=>page(x.dataset.go));
$("loginForm").onsubmit=e=>{e.preventDefault();if($("user").value.trim()==="Hasan"&&$("pass").value==="25808"){sessionStorage.tc="1";start()}else $("err").textContent="بيانات الدخول غير صحيحة."};$("logout").onclick=()=>{sessionStorage.removeItem("tc");location.reload()};$("refresh").onclick=load;$("refreshTop").onclick=load;$("search").oninput=render;$("order").onchange=render;
function resultCard(x,i){let n=N(x),p=P(x),wrong=Math.max(0,n.total-n.score),initial=n.name.trim().charAt(0)||"ط";return `<div class="result" data-index="${i}"><div class="result-avatar">${esc(initial)}</div><div><div class="name">${esc(n.name)}</div><div class="exam">${esc(n.exam)}</div></div><div class="rstat"><b>${n.score} / ${n.total}</b>إجابات صحيحة</div><div class="rstat"><b>${wrong}</b>إجابات خاطئة</div><div class="rpercent">${p}%</div></div>`}
function topCard(x,i){let n=N(x),p=P(x);return `<article class="student"><div class="rank ${i===0?"one":""}">${i+1}</div><div class="name">${esc(n.name)}</div><div class="exam">${esc(n.exam)}</div><div class="meter"><i style="width:${p}%"></i></div><div class="scoreline"><span>${n.score} من ${n.total}</span><b>${p}%</b></div></article>`}
function render(){let term=$("search").value.trim().toLowerCase(),a=rows.filter(x=>N(x).name.toLowerCase().includes(term));a.sort((x,y)=>$("order").value==="desc"?P(y)-P(x):P(x)-P(y));$("resultsList").innerHTML=a.length?a.map((x,i)=>resultCard(x,i)).join(""):`<div class="student">لا توجد نتائج مطابقة.</div>`;document.querySelectorAll(".result").forEach(el=>el.onclick=()=>showDetails(rows[+el.dataset.index]))}
function showDetails(raw){let n=N(raw),p=P(raw),w=Math.max(0,n.total-n.score);$("modalName").textContent=n.name;$("modalBody").innerHTML=`<div class="modal-stat"><div><small>الامتحان</small><b>${esc(n.exam)}</b></div><div><small>النسبة</small><b>${p}%</b></div><div><small>الإجابات الصحيحة</small><b>${n.score}</b></div><div><small>الإجابات الخاطئة</small><b>${w}</b></div><div><small>الدرجة</small><b>${n.score} / ${n.total}</b></div><div><small>التقييم</small><b>${p>=90?"ممتاز 🏆":p>=75?"جيد جداً ⭐":p>=50?"جيد 👍":"يحتاج مراجعة 📚"}</b></div></div>`;$("detailsModal").classList.remove("hidden")}
$("modalClose").onclick=()=>$("detailsModal").classList.add("hidden");$("detailsModal").onclick=e=>{if(e.target.id==="detailsModal")$("detailsModal").classList.add("hidden")};

// ============================================
// 1. دالة تنزيل PDF (شغالة 100%)
// ============================================
$("downloadPdf").onclick=function(){
  if(!rows.length){alert("لا توجد نتائج لتنزيلها.");return}
  if(typeof window.jspdf==="undefined"){alert("جاري تحميل أداة PDF، حاول مرة أخرى.");return}
  let {jsPDF}=window.jspdf;
  let doc=new jsPDF({orientation:"landscape",unit:"pt",format:"a4"});
  doc.setFont("helvetica");
  doc.setFontSize(20);
  doc.text("Hasan Eissa - Student Results",40,45);
  doc.setFontSize(10);
  doc.text(new Date().toLocaleString("en-GB"),40,63);
  let data=rows.slice().sort((a,b)=>P(b)-P(a)).map((x,i)=>{let n=N(x);return [i+1,n.name,n.exam,`${n.score}/${n.total}`,`${Math.max(0,n.total-n.score)}`,`${P(x)}%`]});
  doc.autoTable({startY:80,head:[["#","Student","Exam","Score","Wrong","Percentage"]],body:data,theme:"grid",styles:{fontSize:9,cellPadding:6},headStyles:{fillColor:[22,70,110],textColor:255}});
  doc.save("Hasan-Eissa-Results.pdf")
};

// ============================================
// 2. دالة مسح قاعدة البيانات (مع نسخ PDF احتياطي)
// ============================================
function exportBackupPDF(){
  if(!rows.length) return;
  if(typeof window.jspdf==="undefined"){alert("جاري تحميل أداة PDF...");return}
  let {jsPDF}=window.jspdf;
  let doc=new jsPDF({orientation:"landscape",unit:"pt",format:"a4"});
  doc.setFont("helvetica");
  doc.setFontSize(20);
  doc.text("Hasan Eissa - BACKUP before deletion",40,45);
  doc.setFontSize(10);
  doc.text("تم التصدير قبل المسح: " + new Date().toLocaleString("en-GB"),40,63);
  let data=rows.slice().sort((a,b)=>P(b)-P(a)).map((x,i)=>{let n=N(x);return [i+1,n.name,n.exam,`${n.score}/${n.total}`,`${Math.max(0,n.total-n.score)}`,`${P(x)}%`]});
  doc.autoTable({startY:80,head:[["#","Student","Exam","Score","Wrong","Percentage"]],body:data,theme:"grid",styles:{fontSize:9,cellPadding:6},headStyles:{fillColor:[22,70,110],textColor:255}});
  doc.save("Hasan-Eissa-BACKUP-" + new Date().toISOString().slice(0,10) + ".pdf");
}

$("deleteAll").onclick=function(){
  let confirm1=prompt("⚠️ اكتب كلمة 'نعم' لتأكيد حذف كل البيانات:");
  if(confirm1!=="نعم"){alert("❌ تم الإلغاء.");return}
  let confirm2=confirm("⚠️ تأكيد نهائي: هل أنت متأكد؟");
  if(!confirm2){alert("❌ تم الإلغاء.");return}
  let password=prompt("🔐 كلمة المرور (998877):");
  if(password!=="998877"){alert("❌ كلمة المرور غير صحيحة.");return}
  deleteAllData();
};

async function deleteAllData(){
  try{
    $("deleteAll").disabled=true;
    $("deleteAll").textContent="⏳ جاري المسح...";
    exportBackupPDF();
    let result=await rpc("delete_all_public_data");
    if(result&&result.success){
      alert("✅ تم مسح قاعدة البيانات بنجاح!\n📄 تم حفظ نسخة PDF احتياطية.");
      setTimeout(()=>location.reload(),1000);
    }else{
      alert("❌ خطأ: "+(result?.error||"خطأ غير معروف"));
    }
  }catch(e){
    alert("❌ خطأ: "+e.message);
  }finally{
    $("deleteAll").disabled=false;
    $("deleteAll").textContent="🗑 مسح قاعدة البيانات";
  }
}

// ============================================
// 3. دالة إضافة سؤال (شغالة 100%)
// ============================================
function addQuestion(){
  q++;
  let questionId="q-"+q;
  let d=document.createElement("div");
  d.className="question";
  d.id=questionId;
  d.innerHTML='<div class="qbar"><b>السؤال '+q+'</b><button class="remove" data-qid="'+questionId+'">حذف</button></div><label>نص السؤال</label><input class="qt" placeholder="اكتب السؤال هنا"><label>الاختيارات — اختر الإجابة الصحيحة</label><div class="opts">'+[0,1,2,3].map(function(i){return '<div class="opt"><input type="radio" name="correct_'+q+'" value="'+i+'" '+(i===0?'checked':'')+'><input class="qo" placeholder="الاختيار '+(i+1)+'"></div>';}).join('')+'</div>';
  d.querySelector(".remove").onclick=function(){var id=this.dataset.qid;var el=$(id);if(el)el.remove();};
  $("questions").append(d);
}

$("addQ").onclick=addQuestion;

// ============================================
// 4. باقي الدوال (نفس الأصل)
// ============================================
$("createExam").onclick=async()=>{try{let title=$("examTitle").value.trim()||"امتحان اللغة العربية",duration=+$("duration").value,qs=[...document.querySelectorAll(".question")].map(d=>({text:d.querySelector(".qt").value.trim(),options:[...d.querySelectorAll(".qo")].map(x=>x.value.trim()),correct_index:+d.querySelector("input[type=radio]:checked").value}));if(!duration||!qs.length||qs.some(x=>!x.text||x.options.some(v=>!v)))throw Error("أكمل بيانات الامتحان والأسئلة.");let x=await rpc("create_public_exam",{p_title:title,p_duration_minutes:duration,p_questions:qs}),code=Array.isArray(x)?x[0]?.code:x?.code;if(!code)throw Error("لم يتم إنشاء الامتحان.");$("examLink").value=`${location.origin}${location.pathname.replace(/teacher\.html$/,"index.html")}?exam=${encodeURIComponent(code)}`;$("share").classList.remove("hidden")}catch(e){alert(e.message)}};
$("copy").onclick=async()=>{await navigator.clipboard.writeText($("examLink").value);$("copy").textContent="تم ✓";setTimeout(()=>$("copy").textContent="نسخ",1200)};
async function load(){try{let x=await rpc("teacher_public_results");rows=Array.isArray(x)?x:[];let ps=rows.map(P),avg=ps.length?Math.round(ps.reduce((a,b)=>a+b,0)/ps.length):0,best=ps.length?Math.max(...ps):0,bi=ps.findIndex(x=>x===best);$("total").textContent=rows.length;$("count").textContent=rows.length;$("avg").textContent=avg+"%";$("high").textContent=best+"%";$("highName").textContent=bi>=0?N(rows[bi]).name:"—";let sorted=rows.slice().sort((a,b)=>P(b)-P(a));$("topStudents").innerHTML=sorted.slice(0,3).map((x,i)=>topCard(x,i)).join("")||`<div class="student">لا توجد نتائج حتى الآن.</div>`;render()}catch(e){console.error(e);$("topStudents").innerHTML=`<div class="student">تعذر تحميل النتائج من الخادم.</div>`}}
function start(){$("login").classList.add("hidden");$("app").classList.remove("hidden");if(!document.querySelector(".question"))addQuestion();load()}if(sessionStorage.tc==="1")start();