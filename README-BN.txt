TrystUS — ওয়েবসাইট প্যাকেজ
==========================

এতে আছে:
- কম্পিউটার ও মোবাইলের responsive ডিজাইন
- অ্যাকাউন্ট তৈরি ও লগইন
- ১৮+ বয়স নিশ্চিতকরণ
- সদস্য প্রোফাইল জমা (অ্যাডমিন অনুমোদনের পর প্রকাশ)
- শহর/নাম দিয়ে অনুমোদিত প্রোফাইল খোঁজা
- বেসিক মেসেজ API
- অ্যাডমিনের জন্য pending profile approve/reject API
- Render-এর জন্য render.yaml

লোকাল কম্পিউটারে চালাতে:
1. ZIP Extract করুন।
2. Node.js 20 বা নতুন সংস্করণ ইনস্টল করুন।
3. এই ফোল্ডারে Terminal খুলে `npm install` চালান।
4. `npm start` চালান।
5. ব্রাউজারে http://localhost:3000 খুলুন।

Render-এ প্রকাশ:
- GitHub repository-তে ফাইলগুলো আপলোড করতে হবে।
- Render-এ New Web Service থেকে repository নির্বাচন করতে হবে।
- ADMIN_EMAIL ও ADMIN_PASSWORD environment variables সেট করতে হবে।
- Render-এ persistent disk যুক্ত না করলে JSON data deploy/restart-এর পর স্থায়ী নাও থাকতে পারে।
- বাস্তব ব্যবহারকারীর জন্য production-grade database, durable session store, email verification,
  password reset, image upload moderation, reporting/blocking, privacy/legal review দরকার।

গুরুত্বপূর্ণ:
এটি deploy-ready starter/demo, কিন্তু নিজে থেকে ইন্টারনেটে প্রকাশিত নয়।
কোনো বাস্তব সদস্যের তথ্য বা ছবি ডেমোতে নেই। শুধুমাত্র ১৮+ প্রাপ্তবয়স্কদের জন্য।
এটি সম্মতিপূর্ণ, আইনসম্মত সামাজিক যোগাযোগের জন্য; অবৈধ সেবা, পাচার, জবরদস্তি,
অপ্রাপ্তবয়স্ক বা যৌন শোষণ-সংক্রান্ত কনটেন্ট নিষিদ্ধ।
