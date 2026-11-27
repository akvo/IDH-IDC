import React from "react";
import { render, screen } from "@testing-library/react";
import ToolTags from "../ToolTags";

describe("ToolTags", () => {
  it.each([
    [["academy"], ["LI Academy"]],
    [["idc"], ["IDC"]],
    [
      ["idc", "academy"],
      ["LI Academy", "IDC"],
    ],
  ])("shows the badges for tools %j", (tools, labels) => {
    render(<ToolTags tools={tools} />);
    expect(
      screen.getAllByTestId(/^tool-tag-/).map((tag) => tag.textContent)
    ).toEqual(labels);
  });

  it("uses the Polar Green and Geek Blue tag styles", () => {
    render(<ToolTags tools={["idc", "academy"]} />);
    expect(screen.getByTestId("tool-tag-academy")).toHaveClass(
      "tool-tag--academy"
    );
    expect(screen.getByTestId("tool-tag-idc")).toHaveClass("tool-tag--idc");
  });

  it("adds the given class to the wrapper", () => {
    render(<ToolTags tools={["idc"]} className="extra" />);
    expect(screen.getByTestId("tool-tags")).toHaveClass("tool-tags", "extra");
  });

  it.each([[[]], [null], [["unknown"]]])(
    "renders nothing for tools %j",
    (tools) => {
      const { container } = render(<ToolTags tools={tools} />);
      expect(container).toBeEmptyDOMElement();
    }
  );

  it("shows the empty text when there are no tools", () => {
    render(<ToolTags tools={[]} emptyText="-" />);
    expect(screen.getByText("-")).toBeInTheDocument();
  });
});
