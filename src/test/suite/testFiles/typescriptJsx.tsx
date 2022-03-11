import { useTranslations } from "@vocab/react";
import translations from "./.vocab";
import React from "react";

const MyComponent = () => {
  const { t } = useTranslations(translations);
  return (
    <div>
      This text{" "}
      <a
        href="/foo"
        onClick={(event: MouseEvent) => {
          event.preventDefault();
        }}
      >
        has
      </a>{" "}
      a link
    </div>
  );
};
