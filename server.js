import express from 'express'
import cors from 'cors'
import { graphqlHTTP } from 'express-graphql'
import { makeExecutableSchema } from '@graphql-tools/schema'

import { getFilesFromCollection } from './helpers.js';


async function main() {
// const data = {
//   posts: [
//     { id: 1, name: 'post one', categories: [2], content: 'I love coffee' },
//     { id: 2, name: 'second post', categories: [3], content: 'Strength training and bridge are my life right now'},
//   ],
//   categories: [
//     { id: 1, name: 'food' },
//     { id: 2, name: 'drink', parent: 1}, 
//     { id: 3, name: 'hobby', parent: 2}
//   ]
// }

  const categories = await getFilesFromCollection('categories');
  const posts = await getFilesFromCollection('posts');

  const data = {
    categories,
    posts,
  };

  debugger;

  const typeDefs = `
type Post {
id: Int!
name: String!
content: String!
categories: [Category]!
}

type Category {
id: Int!
name: String!
posts: [Post]!
ancestors: [Category]!
}

type Query {
posts(categoryId: Int): [Post]
post(id: Int!): Post
categories: [Category]
category(id: Int!): Category
}

`

  const resolvers = {
    Query: {
      posts: (obj, args, context, info) => {
        if (args.categoryId) {
          return context.posts.filter(post => post.categories.includes(args.categoryId));
        }

        return context.posts;
      },
      post: (obj, args, context, info) => context.posts.find(post => post.id === args.id),
      categories: (obj, args, context, info) => context.categories,
      category: (obj, args, context, info) => {
        console.log(obj);

        return context.categories.find(category => category.id === args.id);
      },
    },
    Post: {
      categories: (obj, args, context, info) => {
        const categoryIds = obj.categories;

        return context.categories.filter(cat => categoryIds.includes(cat.id));
      },
    },
    Category: {
      posts: (obj, args, context, info) => {
        const catId = obj.id;

        return context.posts.filter(post => post.categories.includes(catId));
      },
      ancestors: (obj, args, context, info) => {
        let parentId = obj.parent;

        const ancestorsArray = [];

        while (parentId !== null) {
          let cat = context.categories.find(category => category.id === parentId);

          if (cat) {
            ancestorsArray.unshift(cat);

            parentId = cat.parent;

            continue;
          }

          parentId = null;
        }

        return ancestorsArray;
      }
    },
  }

  const executableSchema = makeExecutableSchema({
    typeDefs,
    resolvers,
  })

  const app = express()
  const port = 4000

  app.use(cors())
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))

  app.use(
    '/graphql',
    graphqlHTTP({
      schema: executableSchema,
      context: data,
      graphiql: true,
    })
  )

  app.listen(port, () => {
    console.log(`Running a server at http://localhost:${port}`)
  })
}

main();
