import { useTranslations } from "@vocab/react";
import translations from "./.vocab";
import React from "react";

const MyComponent = () => {
  const { t } = useTranslations(translations);
  const emails = { unread: 4, spam: 2 };
  const status = "bad";
  return (
    <div>
      You have {emails.unread} unread emails and {emails.spam} spam emails. This
      is {status}.
    </div>
  );
};
