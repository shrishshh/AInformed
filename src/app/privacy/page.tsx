"use client"

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="container px-4 py-8 mx-auto max-w-3xl">
      <Link
        href="/"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Home
      </Link>

      <h1 className="text-3xl font-bold mb-6 text-foreground">Privacy Policy</h1>

      <div className="prose dark:prose-invert text-muted-foreground space-y-4">
        <p>
          At AInformed, accessible from www.ainformed.com, one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by AInformed and how we use it.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2 text-foreground">1. Consent</h2>
        <p>
          By using our website, you hereby consent to our Privacy Policy and agree to its terms.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2 text-foreground">2. Information We Collect</h2>
        <p>
          The personal information that you are asked to provide, and the reasons why you are asked to provide it, will be made clear to you at the point we ask you to provide your personal information.
        </p>
        <p>
          If you contact us directly, we may receive additional information about you such as your name, email address, phone number, the contents of the message and/or attachments you may send us, and any other information you may choose to provide.
        </p>
        <p>
          When you register for an Account, we may ask for your contact information, including items such as name, company name, address, email address, and telephone number.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2 text-foreground">3. How We Use Your Information</h2>
        <p>
          We use the information we collect in various ways, including to:
        </p>
        <ul className="list-disc list-inside space-y-1">
          <li>Provide, operate, and maintain our website</li>
          <li>Improve, personalize, and expand our website</li>
          <li>Understand and analyze how you use our website</li>
          <li>Develop new products, services, features, and functionality</li>
          <li>Communicate with you, either directly or through one of our partners, including for customer service, to provide you with updates and other information relating to the website, and for marketing and promotional purposes</li>
          <li>Send you emails</li>
          <li>Find and prevent fraud</li>
        </ul>

        <h2 className="text-xl font-semibold mt-6 mb-2 text-foreground">4. Log Files</h2>
        <p>
          AInformed follows a standard procedure of using log files. These files log visitors when they visit websites. All hosting companies do this and are a part of hosting services' analytics. The information collected by log files include internet protocol (IP) addresses, browser type, Internet Service Provider (ISP), date and time stamp, referring/exit pages, and possibly the number of clicks. These are not linked to any information that is personally identifiable. The purpose of the information is for analyzing trends, administering the site, tracking users' movement on the website, and gathering demographic information.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2 text-foreground">5. Cookies and Web Beacons</h2>
        <p>
          Like any other website, AInformed uses 'cookies'. These cookies are used to store information including visitors' preferences, and the pages on the website that the visitor accessed or visited. The information is used to optimize the users' experience by customizing our web page content based on visitors' browser type and/or other information.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2 text-foreground">6. Third-Party Privacy Policies</h2>
        <p>
          AInformed's Privacy Policy does not apply to other advertisers or websites. Thus, we are advising you to consult the respective Privacy Policies of these third-party ad servers for more detailed information. It may include their practices and instructions about how to opt-out of certain options.
        </p>
        <p>
          You can choose to disable cookies through your individual browser options. To know more detailed information about cookie management with specific web browsers, it can be found at the browsers' respective websites.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2 text-foreground">7. CCPA Privacy Rights (Do Not Sell My Personal Information)</h2>
        <p>
          Under the CCPA, among other rights, California consumers have the right to:
        </p>
        <ul className="list-disc list-inside space-y-1">
          <li>Request that a business that collects a consumer's personal data disclose the categories and specific pieces of personal data that a business has collected about consumers.</li>
          <li>Request that a business delete any personal data about the consumer that a business has collected.</li>
          <li>Request that a business that sells a consumer's personal data, not sell the consumer's personal data.</li>
        </ul>
        <p>
          If you make a request, we have one month to respond to you. If you would like to exercise any of these rights, please contact us.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2 text-foreground">8. GDPR Data Protection Rights</h2>
        <p>
          We would like to make sure you are fully aware of all of your data protection rights. Every user is entitled to the following:
        </p>
        <ul className="list-disc list-inside space-y-1">
          <li>The right to access – You have the right to request copies of your personal data. We may charge you a small fee for this service.</li>
          <li>The right to rectification – You have the right to request that we correct any information you believe is inaccurate. You also have the right to request that we complete the information you believe is incomplete.</li>
          <li>The right to erasure – You have the right to request that we erase your personal data, under certain conditions.</li>
          <li>The right to restrict processing – You have the right to request that we restrict the processing of your personal data, under certain conditions.</li>
          <li>The right to object to processing – You have the right to object to our processing of your personal data, under certain conditions.</li>
          <li>The right to data portability – You have the right to request that we transfer the data that we have collected to another organization, or directly to you, under certain conditions.</li>
        </ul>
        <p>
          If you make a request, we have one month to respond to you. If you would like to exercise any of these rights, please contact us.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2 text-foreground">9. Children's Information</h2>
        <p>
          Another part of our priority is adding protection for children while using the internet. We encourage parents and guardians to observe, participate in, and/or monitor and guide their online activity.
        </p>
        <p>
          AInformed does not knowingly collect any Personal Identifiable Information from children under the age of 13. If you think that your child provided this kind of information on our website, we strongly encourage you to contact us immediately and we will do our best efforts to promptly remove such information from our records.
        </p>
      </div>
    </div>
  );
} 