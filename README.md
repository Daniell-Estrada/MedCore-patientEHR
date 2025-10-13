<a name="readme-top"></a>

<div align="center">
<p>
  <img width="300px" src="./src/assets/images/Cuidarte_vive_al_100.png" alt="Logo" />
</p>
</div>

## Description:

Specialized microservice for managing Electronic Health Records (EHR) of patients. This microservice is part of the MedCore ecosystem and is responsible for storing, querying, and updating patient medical information, integrating with the security microservice for user management and authentication. It uses a hybrid architecture with PostgreSQL for relational data and MongoDB for flexible storage of medical documents.

## 🎨 Tools :
- [![Prisma][Prisma-logo]][Prisma-url] Prisma is an open-source database toolkit that simplifies database access and management.
- [![Prisma Client][PrismaClient-logo]][PrismaClient-url] Prisma Client is an auto-generated and type-safe query builder for Node.js and TypeScript.
- [![body-parser][body-parser-logo]][body-parser-url] Body-parser is a middleware for parsing incoming request bodies in a middleware before your handlers, available under the req.body property.
- [![dotenv][dotenv-logo]][dotenv-url] Dotenv is a zero-dependency module that loads environment variables from a .env file into process.env.
- [![express][express-logo]][express-url] Express is a minimal and flexible Node.js web application framework that provides a robust set of features for web and mobile applications.
- [![jsonwebtoken][jsonwebtoken-logo]][jsonwebtoken-url] Jsonwebtoken is a library for generating and verifying JSON Web Tokens for authentication.
- [![mongoose][mongoose-logo]][mongoose-url] Mongoose is an Object Data Modeling (ODM) library for MongoDB and Node.js that manages relationships between data and provides schema validation.
- [![Axios][axios-logo]][axios-url] Axios is a promise-based HTTP client for making requests to external APIs.
- [![CORS][cors-logo]][cors-url] CORS is an Express middleware to enable Cross-Origin Resource Sharing.
- [![Nodemon][nodemon-logo]][nodemon-url] Nodemon is a utility that monitors for any changes in your source and automatically restarts your server.


[Prisma-logo]: https://img.shields.io/badge/Prisma-000000?style=for-the-badge&logo=prisma
[Prisma-url]: https://www.prisma.io/
[PrismaClient-logo]: https://img.shields.io/badge/Prisma_Client-000000?style=for-the-badge&logo=prisma
[PrismaClient-url]: https://www.prisma.io/
[body-parser-logo]: https://img.shields.io/badge/body_parser-000000?style=for-the-badge&logo=nodedotjs
[body-parser-url]: https://www.npmjs.com/package/body-parser
[dotenv-logo]: https://img.shields.io/badge/dotenv-000000?style=for-the-badge&logo=nodedotjs
[dotenv-url]: https://www.npmjs.com/package/dotenv
[express-logo]: https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express
[express-url]: https://expressjs.com/
[jsonwebtoken-logo]: https://img.shields.io/badge/jsonwebtoken-000000?style=for-the-badge&logo=nodedotjs
[jsonwebtoken-url]: https://www.npmjs.com/package/jsonwebtoken
[mongoose-logo]: https://img.shields.io/badge/Mongoose-000000?style=for-the-badge&logo=mongoose
[mongoose-url]: https://mongoosejs.com/
[axios-logo]: https://img.shields.io/badge/Axios-000000?style=for-the-badge&logo=axios
[axios-url]: https://axios-http.com/
[cors-logo]: https://img.shields.io/badge/CORS-000000?style=for-the-badge&logo=nodedotjs
[cors-url]: https://www.npmjs.com/package/cors
[nodemon-logo]: https://img.shields.io/badge/Nodemon-000000?style=for-the-badge&logo=nodemon
[nodemon-url]: https://www.npmjs.com/package/nodemon


## Run Locally

Clone the project

```bash
  git clone https://github.com/Daniell-Estrada/MedCore-patientEHR.git
```

Go to the project directory

```bash
  cd MedCore-patientEHR
```

Install dependencies

```bash
  npm install
```

Generate Prisma customers

```bash
  npm run prisma:gen:postgresql
  npm run prisma:gen:mongodb
```

Run PostgreSQL migrations

```bash
  npm run prisma:migrate:postgresql
```

Start the development server

```bash
  npm run dev
```

## 📊 Database Architecture

This microservice uses a hybrid database architecture:

### PostgreSQL
- **Purpose**: Storage of structured relational data
- **Schema**: `/prisma/postgresql/schema.prisma`
- **Migrations**: Automatic with Prisma Migrate

### MongoDB
- **Purpose**: Flexible storage of medical documents
- **Schema**: `/prisma/mongodb/schema.prisma`
- **Synchronization**: Direct push with Prisma DB Push

## 🔗 Microservice Integration

This microservice integrates with:
- **MS-Security**: For authentication, authorization, and user management

**Note**: All endpoints require JWT authentication and administrator permissions.

## 🚀 About Development Team

- **Naghelly M.** - Scrum Master
- **Jesus A.** - Backend Developer
- **Nicolas C.** - Frontend Developer
- **Daniel E.** - Infrastructure Engineer / QA Engineer
</div>