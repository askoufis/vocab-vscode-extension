import { useTranslations } from "@vocab/react";
import translations from "./.vocab";
import React from "react";

const MyComponent = () => {
  const { t } = useTranslations(translations);
  const unreadEmails = 4;
  const spamEmails = 2;
  return (
    <div>
      You have {unreadEmails} unread emails and {spamEmails} spam emails.
    </div>
  );
};
