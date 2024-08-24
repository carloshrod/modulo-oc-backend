import Sequelize from "sequelize";

export const sequelize = new Sequelize(
  "conprojecto_db_test",
  "postgres",
  "C4rl05_Pg",
  {
    host: "localhost",
    dialect: "postgres",
  }
);
