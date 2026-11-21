// Written answers for chat that is not about the person's own data: who made the Assistant, what it is, opinions, jokes and so on.
// They work offline and always give the same careful answer. Anything not matched here goes on to the normal answers.
const J_EN = [
  'Why did the phone go to the doctor? Because it lost its signal.',
  'I told my battery a joke. It said it was drained already.',
  'Why do programmers prefer dark mode? Because light attracts bugs.',
];
const J_MS = [
  'Kenapa telefon pergi klinik? Sebab dia hilang line.',
  'Saya cerita jenaka kat bateri. Dia kata dia dah letih.',
  'Kenapa programmer suka mod gelap? Sebab cahaya menarik bug.',
];
const MO_EN = [
  'Small steps still count. Do the next small thing, then the one after it.',
  'You do not have to finish everything today. Finish the one thing that matters most.',
  'Rest is part of the work. A tired day is not a failed day.',
];
const MO_MS = [
  'Langkah kecil pun dikira. Buat benda kecil seterusnya, lepas tu yang berikutnya.',
  'Tak perlu siapkan semuanya hari ini. Siapkan satu benda yang paling penting.',
  'Berehat pun sebahagian daripada kerja. Hari yang penat bukan hari yang gagal.',
];
let jn = 0; let mn = 0;

export function chatReply(q: string, lang: string): string {
  const ms = lang === 'ms';
  const t = (q || '').toLowerCase().replace(/[?!.,]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!t || t.length > 120) return '';
  const L = (en: string, bm: string) => (ms ? bm : en);
  if (/(who|siapa).*(made|created|built|developed|programmed|designed|owns|cipta|buat|bina|reka|hasilkan|bangun|pencipta|pembangun)|(your|awak punya|kamu punya|app ni punya).*(creator|developer|maker|owner|pencipta|pembangun)|(siapa|who).*(pencipta|pembangun|developer|creator)/.test(t) && /(you|your|awak|kamu|kau|assistant|pembantu|this app|app ni|aplikasi ni|my life)/.test(t))
    return L('I was made by Adli Syahmi, the developer of My Life. I live inside this app and I answer from the data on your own phone.', 'Saya dicipta oleh Adli Syahmi, pembangun My Life. Saya tinggal dalam app ini dan menjawab berdasarkan data di telefon awak sendiri.');
  if (/(are you|adakah awak|awak ni|kau ni|kamu ni)\s*(chat ?gpt|gpt|gemini|siri|alexa|claude|copilot|a robot|robot|real|human|manusia|a person|orang)/.test(t))
    return L('No. I am the My Life Assistant, built into this app. I am not a person, and I am not ChatGPT or another company\'s chatbot.', 'Bukan. Saya My Life Assistant, dibina dalam app ini. Saya bukan manusia, dan bukan ChatGPT atau chatbot syarikat lain.');
  if (/(tell me about yourself|about yourself|ceritakan tentang awak|cerita pasal awak|introduce yourself|perkenalkan diri)/.test(t))
    return L('I am the My Life Assistant. I read your own data on this phone, such as your tasks, spending, prayers and health, and answer from it. I can also add things for you, like a task or a spending. Ask me anything about your day.', 'Saya My Life Assistant. Saya baca data awak sendiri di telefon ini, seperti tugasan, belanja, solat dan kesihatan, dan menjawab daripadanya. Saya juga boleh tambah sesuatu untuk awak, seperti tugasan atau belanja. Tanyalah apa-apa tentang hari awak.');
  if (/(what do you think|your opinion|your view|do you think|pendapat awak|pendapat kamu|apa pendapat|awak rasa|kamu rasa|pada pandangan awak|apa pandangan)/.test(t))
    return L('I do not have personal opinions the way a person does, but I can help you think it through. Tell me what you are deciding and I will go through the points to weigh. If it is about money or time, I can look at your own numbers too.', 'Saya tak ada pendapat peribadi macam manusia, tapi saya boleh bantu awak fikir. Ceritakan apa yang awak sedang putuskan dan saya senaraikan perkara yang perlu ditimbang. Kalau pasal duit atau masa, saya boleh tengok nombor awak sendiri juga.');
  if (/(tell me a joke|a joke|joke please|buat lawak|cerita lawak|jenaka|buat jenaka|lawak sikit)/.test(t)) { jn++; return ms ? J_MS[jn % J_MS.length] : J_EN[jn % J_EN.length]; }
  if (/(motivate me|motivation|inspire me|bagi semangat|motivasi|beri semangat|nak semangat)/.test(t)) { mn++; return ms ? MO_MS[mn % MO_MS.length] : MO_EN[mn % MO_EN.length]; }
  if (/(how old are you|berapa umur awak|umur awak|umur kamu|when were you (made|born|created)|bila awak dicipta)/.test(t))
    return L('I do not have an age like a person. I was made in 2026 as part of My Life.', 'Saya tak ada umur macam manusia. Saya dicipta pada 2026 sebagai sebahagian daripada My Life.');
  if (/(where do you live|awak tinggal kat mana|awak duduk mana|kamu tinggal di mana|where are you from|awak dari mana)/.test(t))
    return L('I live inside this app, on your phone. Nothing about our chat needs to leave it.', 'Saya tinggal dalam app ini, di telefon awak. Perbualan kita tak perlu keluar dari situ.');
  if (/(i love you|love you|sayang awak|sayang kamu|saya sayang awak)/.test(t))
    return L('That is kind of you. I am glad to help. Tell me what you want to get done today.', 'Baiknya awak. Saya gembira dapat membantu. Beritahu saya apa yang awak nak siapkan hari ini.');
  if (/(i am bored|i'm bored|im bored|bosan|boring)/.test(t) && t.split(' ').length <= 5)
    return L('Let us do something small. I can show your tasks, suggest a walk, or tell you a joke. Which one?', 'Jom buat sesuatu yang kecil. Saya boleh tunjuk tugasan awak, cadangkan jalan-jalan, atau buat lawak. Nak yang mana?');
  if (/(do you sleep|awak tidur ke|awak tidur tak|are you alive|awak hidup)/.test(t))
    return L('No, I do not sleep or get tired. I am here whenever you open the app.', 'Tidak, saya tak tidur dan tak penat. Saya ada bila-bila masa awak buka app.');
  if (/(can you speak|do you speak|awak boleh cakap|boleh cakap bahasa|what languages)/.test(t))
    return L('I understand English and Bahasa Malaysia. For other languages, open the language button in the Assistant and pick one. It is translated on your phone.', 'Saya faham English dan Bahasa Malaysia. Untuk bahasa lain, buka butang bahasa dalam Assistant dan pilih satu. Ia diterjemah dalam telefon awak.');
  return '';
}
