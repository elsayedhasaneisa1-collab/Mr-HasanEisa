const SUPABASE_URL="https://zvvfjmadziyuwutdresz.supabase.co";
const SUPABASE_KEY="sb_publishable_5tzbKmV1EQZTDFLtRPLhnQ_POvlG0Xc";
const db=supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
const $=x=>document.getElementById(x); let exam=null,idx=0,answers=[],endAt=0,timer=null;

async function load(){
 const id=new URLSearchParams(location.search).get("exam");
 if(!id){$("title").textContent="لا يوجد امتحان";$("info").textContent="افتح رابط الامتحان الذي أرسله الأستاذ.";return}
 const {data,error}=await db.rpc("get_public_exam",{p_code:id});
 if(error||!data||!data.length){$("title").textContent="الامتحان غير موجود";$("info").textContent=error?.message||"تأكد من الرابط.";return}
 exam=data[0]; $("title").textContent=exam.title;$("info").textContent=`${exam.question_count} سؤال • الوقت ${exam.duration_minutes} دقيقة`;$("startBtn").disabled=false;
}
$("startBtn").onclick=async()=>{
 const name=$("name").value.trim();if(!name){$("msg").textContent="اكتب اسمك 😊";return}
 const {data,error}=await db.rpc("start_public_attempt",{p_code:exam.code,p_student_name:name});
 if(error){$("msg").textContent="تعذر بدء الامتحان: "+error.message;return}
 exam.questions=data.questions;exam.attempt_id=data.attempt_id;answers=new Array(exam.questions.length).fill(null);idx=0;
 endAt=new Date(data.ends_at).getTime();$("start").classList.add("hide");$("exam").classList.remove("hide");$("liveTitle").textContent=exam.title;$("student").textContent="الطالب: "+name;render();timer=setInterval(clock,250);clock();
};
function clock(){let left=Math.max(0,endAt-Date.now()),s=Math.ceil(left/1000),m=Math.floor(s/60),x=s%60;$("timer").textContent=String(m).padStart(2,"0")+":"+String(x).padStart(2,"0");if(left<=0){clearInterval(timer);submit(true)}}
function render(){let q=exam.questions[idx];$("question").innerHTML=`<div class="q">السؤال ${idx+1}: ${esc(q.text)}</div>`+q.options.map((o,i)=>`<button class="opt ${answers[idx]===i?"sel":""}" data-i="${i}">${esc(o)}</button>`).join("");document.querySelectorAll(".opt").forEach(b=>b.onclick=()=>{answers[idx]=+b.dataset.i;render()});$("progress").style.width=((idx+1)/exam.questions.length*100)+"%";$("prev").disabled=idx===0;$("next").classList.toggle("hide",idx===exam.questions.length-1);$("submit").classList.toggle("hide",idx!==exam.questions.length-1)}
$("next").onclick=()=>{if(idx<exam.questions.length-1){idx++;render()}};$("prev").onclick=()=>{if(idx>0){idx--;render()}};$("submit").onclick=()=>submit(false);
async function submit(auto){clearInterval(timer);let payload=exam.questions.map((q,i)=>({question_id:q.id,selected_index:answers[i]}));$("exam").classList.add("hide");$("result").classList.remove("hide");$("score").textContent="جاري حساب النتيجة...";const {data,error}=await db.rpc("submit_public_attempt",{p_attempt_id:exam.attempt_id,p_answers:payload});if(error){$("score").textContent="حدث خطأ أثناء التسليم: "+error.message;return}$("score").innerHTML=`<div style="font-size:28px;font-weight:bold">درجتك ${data.score} من ${data.total}</div><p>${auto?"⏰ انتهى الوقت وتم التسليم تلقائيًا.":"تم تسليم الامتحان بنجاح 🎉"}</p>`}
function esc(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}

$("teacherBtn").onclick=()=>{$("student").classList.add("hide");$("teacherPage").classList.remove("hide");loadEditors();loadResults()};$("back").onclick=()=>{$("teacherPage").classList.add("hide");$("student").classList.remove("hide")};
function loadEditors(){addQ()}
function addQ(){let d=document.createElement("div");d.className="editor";d.innerHTML=`<label>السؤال<textarea class="qt">اكتب السؤال هنا</textarea></label>${[1,2,3,4].map(n=>`<label>اختيار ${n}<input class="qo" placeholder="الاختيار"></label>`).join("")}<label>الإجابة الصحيحة (1-4)<input class="qc" type="number" min="1" max="4" value="1"></label>`;$("editors").appendChild(d)}
$("add").onclick=addQ;
$("create").onclick=async()=>{let qs=[...document.querySelectorAll(".editor")].map(e=>({text:e.querySelector(".qt").value,options:[...e.querySelectorAll(".qo")].map(x=>x.value),correct_index:+e.querySelector(".qc").value-1}));let {data,error}=await db.rpc("create_public_exam",{p_title:$("tTitle").value,p_duration_minutes:+$("tMinutes").value,p_questions:qs});if(error){$("tmsg").textContent=error.message;return}let link=location.origin+location.pathname+"?exam="+encodeURIComponent(data.code);$("link").value=link;$("tmsg").textContent="تم إنشاء الامتحان. الرابط جاهز 🔗";};
$("copy").onclick=async()=>{if($("link").value){await navigator.clipboard.writeText($("link").value);$("tmsg").textContent="تم نسخ الرابط ✅"}};
async function loadResults(){let {data,error}=await db.rpc("teacher_public_results");$("results").innerHTML=error?error.message:(data?.length?data.map(r=>`<div class="row"><b>${esc(r.student_name)}</b> — ${esc(r.exam_title)}<br>${r.score}/${r.total} — ${esc(r.submitted_at||"")}</div>`).join(""):"لا توجد نتائج بعد.")}
$("refresh").onclick=loadResults;load();