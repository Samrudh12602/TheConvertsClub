import { BUSINESS as B } from "@/lib/business";
import { LEGAL_VERSION, type LegalDocKey } from "@/lib/legal";

export interface LegalSection { heading: string; items: string[] }
export interface LegalDoc { key: LegalDocKey; title: string; summary: string; sections: LegalSection[] }

export interface LegalPolicy {
  refundWindowHours: number;
  recordingRetentionDays: number;
  cancelNoticeHours: number;
  maxReschedules: number;
  feedbackDueHours: number;
  referralBonusEvery: number;
  referralBonusPercent: number;
}

/** Where to write to us, phrased so it stays true on whatever address the site is served from. */
const CONTACT = "the Contact page on our website";

/**
 * The full legal text. Numbers that the admin can change (refund window, notice period...) are filled in
 * from Settings so these pages can never contradict what the product actually does.
 * Drafted for Indian law. It is a thorough draft, NOT legal advice: have an Indian advocate review it.
 */
export function buildLegalDocs(p: LegalPolicy): Record<LegalDocKey, LegalDoc> {
  return {
    terms: {
      key: "terms",
      title: "Terms of Use",
      summary: `Version ${LEGAL_VERSION}. These terms are a binding agreement between you and ${B.operator} (“${B.brand}”, “we”, “us”). Please read them; creating an account, paying, or ticking the box means you accept them.`,
      sections: [
        { heading: "Who we are and what these terms cover", items: [
          `${B.brand} is an online platform that connects people preparing for MBA group discussions and personal interviews (“students”, “you”) with mentors who have been through the process, for mock interviews, group discussions, written-test and statement-of-purpose reviews, and guidance calls (the “Services”).`,
          "These Terms, together with our Privacy Policy and Refund Policy, form the entire agreement between you and us for the Services. If you are a mentor, the Mentor Agreement also applies to you.",
          "By creating an account, making a purchase, booking or attending a session, or ticking the acceptance box, you agree to these Terms. This is a valid electronic contract under the Information Technology Act, 2000, and does not need a physical signature.",
        ] },
        { heading: "Eligibility and your account", items: [
          "You must be at least 18 years old and capable of entering a binding contract under the Indian Contract Act, 1872. If you are under 18 you may use the Services only through, and with the verifiable consent of, a parent or legal guardian, who is then bound by these Terms and responsible for you.",
          "You must give accurate details and keep them up to date. You are responsible for everything done through your account and for keeping your password and login links private. Tell us immediately if you think someone else has accessed your account.",
          "One person, one account. You may not sell, share or transfer your account or your credits to anyone else.",
        ] },
        { heading: "What we provide, and what we do not promise", items: [
          "We provide practice and feedback. We do not run, represent, or have any connection with any business school, admissions committee or examination body. Names of institutes are used only to describe where a mentor studied; no institute endorses us.",
          "We do not guarantee admission, a call, a score, a conversion, or any particular outcome. Preparation helps, but outcomes depend on many things outside our control.",
          "Mentors are independent individuals, not employees, agents or representatives of any institute or of ours for the purpose of giving opinions. Their feedback is their honest opinion and is given for practice purposes only. It is not professional, legal, financial or career advice, and you use it at your own judgement and risk.",
          "We choose and assign mentors based on availability, the focus you select, and our own assessment. You may not demand a particular mentor unless we have said that is available.",
          "We may change, add or retire features, mentors, packages and prices at any time. A change to price or content never affects a purchase you have already completed.",
        ] },
        { heading: "Prices, payment and credits", items: [
          "Prices are shown in Indian rupees at checkout and are the full amount you pay, inclusive of any taxes that apply to us. Where a discount or coupon applies, the final price is shown before you pay.",
          "Payments are processed by Razorpay, an RBI-authorised payment aggregator. We never see or store your full card, UPI or bank details. By paying you also agree to Razorpay’s own terms.",
          "A purchase gives you “credits” for particular kinds of service (for example, a mock PI, a GD session, a WAT evaluation). Credits are personal and non-transferable, are not money, cannot be exchanged for cash, and cannot be used for a different kind of service unless we expressly allow it.",
          "Credits do not expire unless a validity period is stated at the time of purchase, or we give you at least 30 days’ written notice before introducing one. A credit that is attached to a session you have already booked is never withdrawn by us.",
          "A credit is “used” when a session or review it was reserved for is completed, when you cancel late or do not attend, or when you submit work for review.",
          "Coupon and referral codes are single-use per order, cannot be combined unless stated, have no cash value, and may be refused, cancelled or reversed by us if they are used in a way that is fraudulent, abusive or against their purpose. A mentor may not use their own referral code.",
        ] },
        { heading: "Booking, rescheduling, cancelling and no-shows", items: [
          `You can reschedule or cancel a booked session free of charge up to ${p.cancelNoticeHours} hours before it starts. You may reschedule a single session up to ${p.maxReschedules} times.`,
          `If you cancel inside the ${p.cancelNoticeHours}-hour notice period, or do not attend, or join so late that the session cannot reasonably be held, the credit is treated as used.`,
          "If we or the mentor cancel, or no mentor can be found, your credit is returned in full, or the session is rescheduled to a time that suits you.",
          "Sessions run at the time shown in India Standard Time. Joining on time, with a working camera, microphone and internet connection, is your responsibility. A session lost to your own technical problems counts as attended.",
          `Written feedback is normally delivered within ${p.feedbackDueHours} hours of a session. Where a mentor is late, we will follow up; a delay does not entitle you to a refund by itself.`,
        ] },
        { heading: "How you must behave", items: [
          "Be honest, respectful and professional with mentors, staff and other students. Do not harass, abuse, threaten, discriminate against, or sexually or otherwise inappropriately approach anyone. We have zero tolerance for this and may end your access immediately and without refund.",
          "Do not impersonate anyone, give false information, or submit work that is not yours and present it as yours.",
          "Do not attempt to bypass the platform: do not ask mentors to take payments, bookings or services outside The Convert Club, and do not contact mentors for paid services other than through us.",
          "Do not misuse the site: no scraping, probing, overloading, reverse engineering, or attempts to access other people’s data or accounts.",
          "Group discussion batches contain other students. Do not record, copy or share what other participants say or reveal who took part.",
        ] },
        { heading: "Recordings, your content, and our rights in it", items: [
          `Some sessions may be recorded by us, so you can review them and so we can maintain quality. Recordings are kept for ${p.recordingRetentionDays} days and are visible to you, your assigned mentor and our administrators. By attending, you consent to this. You must not record, screenshot or share any session yourself, and you must not share a recording with anyone else.`,
          "You keep ownership of what you submit (resume, essays, SOPs, profile details, answers). You give us a limited, non-exclusive, worldwide licence to store, process and show it to your assigned mentor and our staff, solely to provide and improve your Services. We do not sell it or use it for advertising.",
          "You confirm that what you submit is yours, or that you have the right to submit it, and that it does not infringe anyone’s rights or break the law.",
          "Everything else on the platform (the site, design, questions, scorecards, library material, mentor-created resources, trademarks and logos) belongs to us or our licensors. You may use it for your own preparation only. You may not copy, resell, publish or distribute it.",
        ] },
        { heading: "Privacy and communications", items: [
          "How we handle your personal data is described in our Privacy Policy, which forms part of these Terms.",
          "You agree that we may send you service messages (receipts, booking confirmations, reminders, feedback and account notices) by email and in the app. These are necessary for the Services and are not marketing.",
        ] },
        { heading: "Suspension and ending", items: [
          "You can stop using the Services at any time and can ask us to delete your account from your settings; any unused credits are then dealt with under the Refund Policy.",
          "We may suspend or end your access, with or without notice, if you materially breach these Terms, behave abusively, act fraudulently, or where required by law. If we end your access without a breach by you, we will refund the value of your unused credits as the Refund Policy provides.",
          "Clauses that by their nature should survive (payment, content licence, liability, disputes) continue after your access ends.",
        ] },
        { heading: "Disclaimers and limits on our liability", items: [
          "The Services are provided on an “as is” and “as available” basis. We do not promise the site will be uninterrupted or error-free, though we work to keep it reliable.",
          "To the fullest extent the law allows, we are not liable for any indirect, incidental, special or consequential loss, or for loss of opportunity, admission, placement, income or reputation, arising from your use of the Services or from a mentor’s opinion.",
          "To the fullest extent the law allows, our total liability to you for any claim relating to the Services is limited to the amount you actually paid us for the specific service the claim relates to, in the 12 months before the claim arose.",
          "Nothing in these Terms excludes or limits any liability that cannot lawfully be excluded, including liability for fraud or wilful misconduct, or your rights as a consumer under the Consumer Protection Act, 2019.",
          "We are not liable for any delay or failure caused by events beyond our reasonable control, including outages of internet, payment, email or video services, natural events, strikes, government action or pandemics.",
        ] },
        { heading: "Your responsibility to us", items: [
          "You agree to compensate us for loss and reasonable costs that we suffer because of your breach of these Terms, your unlawful conduct, or content you submit that infringes someone else’s rights. This does not apply to the extent we caused the loss.",
        ] },
        { heading: "Complaints and grievance officer", items: [
          `If you have a complaint, write to us through ${CONTACT}. Our Grievance Officer is ${B.grievanceOfficer}. We will acknowledge your complaint within 48 hours and aim to resolve it within 30 days, as the Consumer Protection (E-Commerce) Rules, 2020 and the Information Technology (Intermediary Guidelines) Rules, 2021 require.`,
        ] },
        { heading: "Governing law and disputes", items: [
          "These Terms are governed by the laws of India.",
          `We first try to settle any dispute through good-faith discussion for 30 days after you write to us. If it is not settled, it is finally resolved by arbitration under the Arbitration and Conciliation Act, 1996, before a single arbitrator appointed by mutual agreement (or, failing agreement, by the courts), seated in ${B.jurisdiction}, in English.`,
          `Subject to that, the courts at ${B.jurisdiction} have exclusive jurisdiction. Nothing in this clause takes away your statutory right as a consumer to approach a Consumer Disputes Redressal Commission or any other forum that the law gives you.`,
        ] },
        { heading: "General", items: [
          "We may update these Terms. If a change is material, we will tell you in the app or by email, and you will be asked to accept the new version before you continue. Continued use after that is acceptance.",
          "If any part of these Terms is found unenforceable, the rest remains in force. A failure to enforce a right is not a waiver of it. You may not assign these Terms; we may assign them to a successor of our business.",
          "These Terms, the Privacy Policy and the Refund Policy are the entire agreement between us for the Services and replace any earlier understanding.",
        ] },
      ],
    },

    privacy: {
      key: "privacy",
      title: "Privacy Policy",
      summary: `Version ${LEGAL_VERSION}. How ${B.brand} collects, uses, shares and protects your personal data, in line with the Digital Personal Data Protection Act, 2023 and the Information Technology Act, 2000.`,
      sections: [
        { heading: "Who is responsible", items: [
          `${B.operator} is the “data fiduciary” for personal data collected through our website. Our Grievance Officer is ${B.grievanceOfficer}; reach us through ${CONTACT}.`,
        ] },
        { heading: "What we collect", items: [
          "Account details: your name, email address, phone number, and password (stored only as a one-way cryptographic hash, never in readable form).",
          "Profile details you choose to give us: college, work experience, calls received, target institutes, strengths and weaknesses, and similar preparation information.",
          "What you submit: resumes, essays, SOPs and other documents, and your messages with us and your mentors.",
          "Session data: bookings, attendance, mentor feedback and scores, ratings you give, and, where sessions are recorded, the recording.",
          "Payment records: order amount, coupon used, and payment status and reference from Razorpay. We do not receive or store your full card, UPI PIN or bank login details.",
          "Technical data: IP address, device and browser type, and security logs, used to keep the service safe.",
          "For mentors, in addition: professional photo, institute, LinkedIn profile, availability, session history, and payout details (kept encrypted).",
          "We use only essential cookies that keep you signed in and secure. We do not use advertising or cross-site tracking cookies.",
        ] },
        { heading: "Why we use it, and on what basis", items: [
          "To create your account, take payment, deliver sessions and feedback, match you with a mentor, send reminders and receipts, and give you support. We do this because you ask us to and consent to it when you accept our Terms.",
          "To keep the service secure, prevent fraud and misuse, and meet our legal duties (accounts, tax and audit records).",
          "To improve the service, for example by looking at which features are used and how sessions are rated, using aggregated or de-identified data wherever possible.",
          "We will not sell your personal data, and we will not use it for third-party advertising.",
        ] },
        { heading: "Who can see your data", items: [
          "Your assigned mentor sees the profile information, documents and history needed to run your session. Mentors are bound by a confidentiality and data-protection agreement with us.",
          "Our administrators see what they need to run and support the service.",
          "Other students never see your data. In group discussions, other participants see your first name or display name and what you say in the session.",
          "On public pages, a mentor’s name, photo, college, bio, and an average rating and session count may be shown. Students’ names and comments are not shown publicly.",
        ] },
        { heading: "Service providers we rely on", items: [
          "We use trusted providers to run the service: Razorpay (payments); Vercel (website hosting and file storage); Neon (database hosting); Google (email delivery through Gmail, and sign-in if you choose it) and Resend (email delivery); and a video-meeting provider for sessions (the mentor’s own meeting link or a Jitsi Meet room).",
          "These providers process data only to provide their service to us, under their own security and privacy commitments. Some of them store or process data on servers outside India. By accepting this policy you consent to that transfer, which is made in accordance with the DPDP Act and any restrictions notified under it.",
          "We may disclose data where the law requires it, or to protect our rights, safety or those of others, in response to a lawful order from a competent authority.",
        ] },
        { heading: "How long we keep it", items: [
          `Session recordings are kept for ${p.recordingRetentionDays} days. Documents you upload are deleted within 30 days of an account-deletion request.`,
          "Records we are legally required to keep, such as payment and tax records, are retained for the period the law requires (generally up to eight years), but are kept separately and used only for that purpose.",
          "Security logs are kept for a limited period. Data that no longer serves its purpose is deleted or anonymised.",
        ] },
        { heading: "How we protect it", items: [
          "Data is encrypted in transit (HTTPS). Sensitive items such as payout details are encrypted at rest. Passwords are hashed. Access is limited by role, and we log administrator actions.",
          "No system is perfectly secure. If a personal-data breach affects you, we will tell you and the Data Protection Board of India as the law requires.",
        ] },
        { heading: "Your rights", items: [
          "You can ask us to: confirm and give you a summary of the personal data we hold and who we share it with; correct or complete it; erase it; and nominate another person to exercise these rights if you die or become incapacitated.",
          "You can withdraw your consent at any time. Withdrawing consent means we may no longer be able to provide the Services. It does not affect anything done before you withdrew.",
          `You can export your data and request deletion from your account settings, or write to us through ${CONTACT}. We will respond within a reasonable time and in any event within the period the law sets.`,
          "If you are not satisfied with our response, you may complain to the Data Protection Board of India once it is constituted and the law allows you to approach it.",
        ] },
        { heading: "Children", items: [
          "The Services are meant for adults preparing for postgraduate admission. We do not knowingly collect data from anyone under 18 without the verifiable consent of a parent or guardian. If you believe a child’s data has reached us without that consent, tell us and we will delete it.",
        ] },
        { heading: "Changes", items: [
          "We may update this policy. For a material change we will notify you and, where the law requires, ask for your consent again.",
        ] },
      ],
    },

    refunds: {
      key: "refunds",
      title: "Refund and Cancellation Policy",
      summary: `Version ${LEGAL_VERSION}. When you can get your money back, how to ask, and how long it takes.`,
      sections: [
        { heading: "Full refund within the cooling-off window", items: [
          `You can get a full refund of what you paid if you ask within ${p.refundWindowHours} hours of purchase and you have not used any credit from that purchase. A credit is “used” as explained in the Terms of Use.`,
        ] },
        { heading: "After you have used a credit", items: [
          "Once any credit from a purchase has been used, that purchase is not refundable, because the service has been delivered in part. Unused credits from it may, at our discretion, be exchanged for a different kind of service of equal value, but are not refunded in cash.",
          "If a bundle is refunded within the window, the refund is the amount you actually paid, after any discount or coupon, and the credits from that purchase are cancelled.",
        ] },
        { heading: "When we are at fault", items: [
          "If we or your mentor cancel a session, or no mentor can be found for a slot you booked, the credit is restored in full and you may rebook or, if we cannot provide the service, ask for a refund of that credit’s value.",
          "If a payment was taken but no credits were granted, or you were charged twice, tell us with your order number and we will correct it or refund the extra amount in full.",
        ] },
        { heading: "How to ask", items: [
          `Write to us through ${CONTACT} with your registered email and order number, or use the contact option in your account. We will acknowledge within 48 hours.`,
          "Approved refunds are sent back to the original payment method. They usually reach your account within 5 to 7 working days of approval, depending on your bank or card issuer.",
        ] },
        { heading: "Other points", items: [
          "Chargebacks: please contact us first. If a payment is reversed through your bank without contacting us, we may suspend your account while we look into it.",
          "Referral and discount codes have no cash value and are not refunded separately.",
          "Nothing here limits your rights under the Consumer Protection Act, 2019 or the Consumer Protection (E-Commerce) Rules, 2020.",
        ] },
      ],
    },

    "mentor-agreement": {
      key: "mentor-agreement",
      title: "Mentor Agreement",
      summary: `Version ${LEGAL_VERSION}. The agreement between ${B.operator} (“${B.brand}”, “we”) and each mentor (“you”). It applies together with the Terms of Use and Privacy Policy. Please read it before you accept.`,
      sections: [
        { heading: "Your role", items: [
          "You are an independent contractor engaged to provide mentoring services to students on the platform. You are not our employee, partner, agent or joint venturer. You have no authority to bind us, and nothing here creates employment, so you are not entitled to employee benefits.",
          "You decide your own availability within the hours you publish, and are free to work for others. You are not exclusive to us, subject to the confidentiality and non-solicitation promises below.",
          "You provide the services personally. You may not delegate a session to anyone else.",
        ] },
        { heading: "What we expect from you", items: [
          "Take sessions you have accepted on time, prepared, with a working camera, microphone and connection, in a quiet and professional setting.",
          `Submit the written feedback for each session within ${p.feedbackDueHours} hours, and make it honest, specific and constructive.`,
          `If you cannot take a session, tell us and the student at least ${p.cancelNoticeHours} hours ahead wherever possible. Repeated late cancellations or no-shows may lead to pause or removal.`,
          "Be truthful about your background. The college, batch and calls you converted that you give us must be accurate. Giving false information is grounds for immediate termination.",
          "Give your honest opinion for practice only. Do not promise, guarantee or imply admission, selection or any outcome, and do not claim to speak for any institute.",
          "Treat every student with respect and fairness. Discrimination, harassment, inappropriate behaviour, or pressuring students is prohibited and may lead to immediate removal and, where appropriate, reporting to the authorities.",
        ] },
        { heading: "Pay and tax", items: [
          `You are paid the per-session amounts shown for your tier in your portal. Rates can be changed by us for future sessions on notice in the portal; they do not change for sessions already completed.`,
          `Referral bonus: for every ${p.referralBonusEvery} students who buy using your referral code, you earn ${p.referralBonusPercent}% of the fees those students actually paid (after any discount). A purchase counts only once its refund window has passed and only if it was not refunded; a student counts once, however many times they buy. Bonuses are approved by us and paid with your session pay. We may change or end the referral bonus for referrals made after we tell you in the portal; it does not change for groups already earned.`,
          "Pay accrues when you submit feedback for a completed session and is paid in the cycle shown in your portal, to the payout account you give. Sessions that are cancelled, not attended by you, or found to be fraudulent do not earn pay, and amounts paid in error or because of a breach can be recovered from later payouts.",
          "You are responsible for your own taxes. We may deduct tax at source or collect tax details where the law requires, and will give you the statement. You must give correct PAN and payout details.",
          "Referral coupons given to you are a tool to share the platform. They do not by themselves entitle you to any payment, commission or reward unless we have told you so in writing.",
        ] },
        { heading: "Student data and confidentiality", items: [
          "You will see students’ profiles, documents and feedback. This is confidential. Use it only to prepare for and deliver the sessions assigned to you. Do not copy it, store it outside the platform, share it, or use it for any other purpose.",
          "You process this personal data only on our instructions and must keep it secure, follow the Privacy Policy and the Digital Personal Data Protection Act, 2023, and tell us at once about any loss, leak or unauthorised access.",
          "When a student’s assignment ends, or you stop mentoring, you must delete any student material you hold and keep nothing.",
          "Do not record, screenshot or share a session unless the platform records it. Do not reveal who took part in group discussions.",
          "Our non-public information (pricing, how the platform works, processes, other mentors’ pay, and student lists) is also confidential. This duty continues after you leave.",
        ] },
        { heading: "Staying on the platform", items: [
          "During your time with us, and for 12 months after, you will not use the platform’s access to students to solicit them for paid coaching, mock interviews or similar services outside the platform, or ask them to pay you directly. This protects the students’ safety and our business and does not stop you from helping people you meet in any other way.",
          "You will not use your referral code or the platform to mislead students, send spam, or make misleading claims about us, the results, or the prices.",
        ] },
        { heading: "Ownership of what you create", items: [
          "You keep the ownership of your pre-existing knowledge and materials. For feedback, scorecards, questions and resources that you create for the platform, you give us a worldwide, perpetual, royalty-free, non-exclusive licence to use, adapt and show them to students and staff in connection with the Services.",
          "You confirm that what you provide is your own work, or that you have the right to use it, and does not infringe anyone else’s rights or break any confidentiality owed by you to a third party, such as an employer or institute.",
          "You may use your name and the fact that you are a mentor with us as a factual statement of your experience. You may not use our brand, logo, or student testimonials in a way that suggests more than that without written permission.",
          `You grant us the right to show your name, photo, college and bio, and your average rating and session count, on the public Mentors page of our website, where we have marked you visible. You can ask us to hide it at any time.`,
        ] },
        { heading: "Conflicts and conduct", items: [
          "Tell us at once if a student assigned to you is someone you know personally, or if you have any other conflict of interest, so we can reassign the session.",
          "Do not accept anything of value from a student or on a student’s behalf for any favourable treatment, score or recommendation.",
        ] },
        { heading: "Liability", items: [
          "You are responsible for your own conduct and the quality of the opinions you give. You will compensate us for loss and reasonable costs we suffer as a direct result of your fraud, wilful misconduct, serious breach of confidentiality or data protection, or infringement caused by what you supply.",
          "To the fullest extent the law allows, neither party is liable to the other for indirect or consequential loss. Our total liability to you is limited to the pay due to you for completed sessions that has not yet been paid, except where the law does not allow us to limit it.",
        ] },
        { heading: "Pausing and ending", items: [
          "You can pause or stop mentoring with us at any time, with 7 days’ notice where there are sessions already booked in your name, so that students are not left without a mentor.",
          "We can pause or end this agreement with 7 days’ notice, or immediately if you breach it seriously, act dishonestly, harm a student, or if a student’s or our safety or reputation is at risk. Pay already earned for completed, approved sessions is paid, subject to any amounts recoverable.",
          "On ending, you remain bound by the confidentiality, data, non-solicitation, ownership and liability clauses.",
        ] },
        { heading: "Law, disputes and general", items: [
          "This agreement is governed by Indian law. Disputes are first discussed in good faith for 30 days and then resolved by arbitration under the Arbitration and Conciliation Act, 1996, before a single arbitrator, seated in " + B.jurisdiction + ", in English. Subject to that, the courts there have exclusive jurisdiction.",
          "We may update this agreement. For a material change we will tell you and ask you to accept the new version before you continue taking sessions.",
          "If any part is unenforceable the rest stays in force. This agreement, with the Terms of Use and Privacy Policy, is the entire understanding between us on mentoring.",
          `Questions or complaints: ${CONTACT}. Grievance Officer: ${B.grievanceOfficer}.`,
        ] },
      ],
    },
  };
}
