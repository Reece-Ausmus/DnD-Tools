import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders app and checks for key UI", async () => {
  render(<App />);
  const title = await screen.findByText(/dnd/i); // looks for the title "dnd" in the document
  expect(title).toBeInTheDocument();
});
