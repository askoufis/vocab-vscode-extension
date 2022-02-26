import { useTranslations } from "@vocab/react";
import translations from "./.vocab";
import React from "react";
import { Foo } from "./Foo";

const MyComponent = () => {
  const { t } = useTranslations(translations);
  return (
    <div>
      I am a paragraph with some{" "}
      <div className="bar">
        <Foo.Bar>
          <b>bold</b>
        </Foo.Bar>{" "}
        and <i>italic</i>
      </div>{" "}
      text and a <a href="/foo">link</a>
    </div>
  );
};
