import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import DemoLoginForm from "./DemoLoginForm";

describe("DemoLoginForm", () => {
  it("submits the entered password and closes only after successful login", async () => {
    const onSubmit = jest.fn().mockResolvedValue(true);
    const onClose = jest.fn();
    render(
      <DemoLoginForm onSubmit={onSubmit} onClose={onClose} error="" />,
    );

    fireEvent.change(screen.getByLabelText("Demo password"), {
      target: { value: "demo-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith("demo-password"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows the failure and leaves the form open after unsuccessful login", async () => {
    const onSubmit = jest.fn().mockResolvedValue(false);
    const onClose = jest.fn();
    render(
      <DemoLoginForm
        onSubmit={onSubmit}
        onClose={onClose}
        error="That demo password was not accepted."
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "That demo password was not accepted.",
    );
    fireEvent.change(screen.getByLabelText("Demo password"), {
      target: { value: "wrong-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith("wrong-password"));
    expect(onClose).not.toHaveBeenCalled();
  });
});
