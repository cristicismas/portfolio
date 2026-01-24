const buildTableOfContentsStructure = () => {
  const h2s = document.getElementsByTagName("h2");

  const structure = [];

  for (const h2 of h2s) {
    h2.id = h2.textContent.trim().replaceAll(" ", "-");

    structure.push({ id: h2.id, title: h2.textContent.trim(), children: [] });
  }

  const h3s = document.getElementsByTagName("h3");

  const getPreviousH2 = (elem) => {
    if (!elem.previousSibling) return null;

    if (elem?.previousSibling?.tagName?.toUpperCase() === "H2") {
      return elem?.previousSibling;
    } else {
      return getPreviousH2(elem.previousSibling);
    }
  };

  for (const h3 of h3s) {
    const previousH2 = getPreviousH2(h3);

    if (previousH2) {
      const index = structure.findIndex((elem) => elem.id === previousH2.id);

      if (index) {
        h3.id = h3.textContent.trim().replaceAll(" ", "-").replaceAll("'", "");
        structure[index].children.push({
          id: h3.id,
          title: h3.textContent.trim(),
        });
      }
    }
  }

  return structure;
};

const init = () => {
  const structure = buildTableOfContentsStructure();

  const TOC = document.getElementById("table-of-contents");

  const html = `
    ${structure
      .map(
        (h2) => `<div>
      <div><a class='toc-link h2' href='#${h2.id}'>${h2.title}</a></div>
      ${h2.children
        .map(
          (h3) => `
        <div><a class='toc-link h3' href='#${h3.id}'>${h3.title}</a></div>
      `,
        )
        .join(" ")}
    </div>`,
      )
      .join(" ")}
  `;

  TOC.insertAdjacentHTML("beforeend", html);
};

init();
