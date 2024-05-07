import React, { useState } from "react";
import { PageTitle } from "../components/PageTitle";
import { PageContent } from "../components/PageContent";
import { InlineWidget, type Item } from "../components/InlineWidget";
import SecureInput from "../custom-components/SecureInput";

export const content = `
This component allows you to create a secure input field. The input field is rendered in an iframe, and the inputted data is sent to the bot via a secure channel. This means that the inputted data is not accessible to the website owner.

~~~js
const SecureInput = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleEmailChange = (event) => {
    setEmail(event.target.value);
  };

  const handlePasswordChange = (event
  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setIsSuccess(true);
    } catch (error) {}

    setIsLoading(false);
  };

  if (isSuccess) {
    return (
      <div className="success-container">
        ✅
      </div>
    );
  }

  return (
    <div className="form-container">
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          id="email"
          placeholder="Email"
          className="form-input"
          value={email}
          onChange={handleEmailChange}
          required
          disabled={isLoading}
        />
        <input
          type="password"
          id="password"
          placeholder="Password"
          className="form-input"
          value={password}
          onChange={handlePasswordChange}
          required
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? "Loading..." : "Login"}
        </button>
      </form>
    </div>
  );
};
~~~
`;

export const WebWidgetComponentsSecureInput = (): JSX.Element => {
  const [submitted] = useState(false);

  const items: Item[][] = [
    [
      {
        type: "custom",
        element: <SecureInput />,
      },
    ],
  ];

  if (submitted) {
    items.push([
      {
        type: "bot",
        message: `Thank you! You're now logged in.`,
      },
    ]);
  }

  return (
    <>
      <PageTitle pretitle="Web widget components" title="Secure input" />
      <InlineWidget className="mb-8" items={items} />
      <PageContent md={content} />
    </>
  );
};
