import remarkFrontmatter from 'remark-frontmatter';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import { cwd } from 'process';
import { join } from 'path';
import { opendir, readFile } from 'node:fs/promises';
import { unified } from 'unified';
import toml from 'toml';

const processor = async (content) => {
  const result = await unified()
    .use(remarkParse)
    .use(remarkStringify)
    .use(remarkFrontmatter, ['toml'])
    .use(() => (tree,file) => {
      if (tree.children[0]?.type === 'toml') {
        const data = tree.children[0].value;

        file.data.matter = toml.parse(data);
        tree.children.shift()
      }
    })
    .process(content)

  return result;
}

function makeGraphQlFriendly(vFile) {
  const newItem = {
    ...vFile.data.matter,
    content: vFile.value,
  }

  return newItem;
}

export async function getFilesFromCollection(collection) {
  const contentArray = [];

  const path = join(cwd(), './content/', collection)

  const entities = await opendir(path);

  console.log("looking for: " + collection + " at " + path);

  for await (const entity of entities) {
    const fileContent = await readFile(join(path, entity.name), 'utf8');

    const content = await processor(fileContent);

    contentArray.push(content);
  }

  return contentArray.map(makeGraphQlFriendly);
}

