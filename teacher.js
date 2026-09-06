const SUPABASE_URL = "https://zvvfjmadziyuwutdresz.supabase.co";
const SUPABASE_KEY = "sb_publishable_5tzbKmV1EQZTDFLtRPLhnQ_POvlG0Xc";
const TEACHER_USER = "Hasan";
const TEACHER_PASS = "25808";

const $ = id => document.getElementById(id);
let questionCount = 0;

function headers(){return {"Content-Type":"application/json","apikey":SUPABASE_KEY,"Authorization":"Bearer "+SUPABASE_KEY};}
async function rpc(fn, body){
  const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {method:"POST",headers:headers(),body:JSON.stringify(body)});
  const text = await r.text();
  if(!r.ok) throw new Error(text || `HTTP ${r.status}`);
  return text ? JSON.parse(text) : null;
}
function msg(text, bad=false){$("message").textContent=text;$("message").className="message "+(bad?"bad":"ok");setTimeout(()=>{$("message").className="message";$("message").textContent=""},5000)}

$("togglePass").onclick=()=>{$("password").type=$("password").type==="password"?"text":"password"};

$("loginForm").onsubmit=e=>{
  e.preventDefault();
  if($("username").value.trim()===TEACHER_USER && $("password").value===TEACHER_PASS){
    sessionStorage.setItem("hasan_teacher_login","1");
    $("loginScreen").classList.add("hidden");
    $("dashboard").classList.remove("hidden");
    if(!$("questions").children.length) addQuestion();
    loadResults();
  }else{
    $("loginError").textContent="اسم المستخدم أو كلمة المرور غير صحيحة.";
  }
};

$("logoutBtn").onclick=()=>{
  sessionStorage.removeItem("hasan_teacher_login");
  location.reload();
};

function addQuestion(){
  questionCount++;
  const n=questionCount;
  const el=document.createElement("div");
  el.className="question";
  el.innerHTML=`
    <div class="q-head"><span class="q-number">السؤال ${n}</span><button type="button" class="remove">حذف</button></div>
    <label>نص السؤال</label>
    <input class="q-text" placeholder="اكتب السؤال هنا">
    <label>الاختيارات — اختر الإجابة الصحيحة</label>
    <div class="options">
      ${[0,1,2,3].map(i=>`<div class="option-row"><input type="radio" name="correct_${n}" value="${i}" ${i===0?"checked":""}><input class="opt" placeholder="الاختيار ${i+1}"></div>`).join("")}
    </div>`;
  el.querySelector(".remove").onclick=()=>el.remove();
  $("questions").appendChild(el);
}
$("addQuestion").onclick=addQuestion;

$("createExam").onclick=async()=>{
  try{
    const title=$("examTitle").value.trim()||"امتحان اللغة العربية";
    const duration=parseInt($("duration").value,10);
    if(!duration||duration<1) throw new Error("اكتب مدة صحيحة.");
    const qs=[...document.querySelectorAll(".question")].map((el)=>{
      const opts=[...el.querySelectorAll(".opt")].map(x=>x.value.trim());
      const checked=el.querySelector('input[type="radio"]:checked');
      return {text:el.querySelector(".q-text").value.trim(), options:opts, correct_index:checked?Number(checked.value):0};
    });
    if(!qs.length) throw new Error("أضف سؤالاً واحداً على الأقل.");
    if(qs.some(q=>!q.text || q.options.some(o=>!o))) throw new Error("أكمل السؤال والاختيارات.");
    const data=await rpc("create_public_exam",{p_title:title,p_duration_minutes:duration,p_questions:qs});
    const code=Array.isArray(data)?data[0]?.code:data?.code;
    if(!code) throw new Error("تم الإنشاء لكن لم يصل رمز الامتحان.");
    const link=`${location.origin}${location.pathname.replace(/\/teacher\.html$/,"/index.html")}?exam=${encodeURIComponent(code)}`;
    $("examLink").value=link;
    $("linkBox").classList.remove("hidden");
    msg("تم إنشاء الامتحان بنجاح 🎉");
  }catch(e){msg(e.message||"حدث خطأ.",true)}
};

$("copyLink").onclick=async()=>{
  try{await navigator.clipboard.writeText($("examLink").value);msg("تم نسخ رابط الامتحان 📋");}
  catch{ $("examLink").select(); document.execCommand("copy"); msg("تم نسخ الرابط 📋");}
};

async function loadResults(){
  try{
    const data=await rpc("teacher_public_results",{});
    const rows=Array.isArray(data)?data:[];
    $("results").innerHTML=rows.length?rows.map(r=>`
      <div class="result">
        <strong>${esc(r.student_name||"—")}</strong>
        <span>${esc(r.exam_title||"—")} • ${r.score ?? 0}/${r.total_questions ?? 0}</span>
      </div>`).join(""):`<p class="muted">لا توجد نتائج حتى الآن.</p>`;
  }catch(e){$("results").innerHTML=`<p class="muted">تعذر تحميل النتائج.</p>`}
}
$("refreshResults").onclick=loadResults;

$("clearData").onclick=async()=>{
  if(!confirm("هل أنت متأكد؟ سيتم مسح بيانات الامتحانات والنتائج.")) return;
  const p=prompt("للتأكيد اكتب كلمة مرور المعلم:");
  if(p!==TEACHER_PASS) return alert("كلمة المرور غير صحيحة.");
  try{await rpc("delete_all_exam_data",{});msg("تم مسح بيانات الامتحانات والنتائج.");loadResults();}
  catch(e){msg("تعذر مسح البيانات. تأكد من وجود دالة delete_all_exam_data في Supabase.",true)}
};

function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));}

if(sessionStorage.getItem("hasan_teacher_login")==="1"){
  $("loginScreen").classList.add("hidden");
  $("dashboard").classList.remove("hidden");
  addQuestion();
  loadResults();
}
