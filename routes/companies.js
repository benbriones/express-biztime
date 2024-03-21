"use strict";

const express = require("express");

const db = require("../db")
const router = new express.Router();

const { BadRequestError, NotFoundError } = require('../expressError');

/** returns JSON list of companies like {companies: [{code, name}, ...]}*/

router.get('/', async function (req, res, next) {

  const results = await db.query(
    `SELECT code, name
    FROM companies
    ORDER BY code`
  );

  const companies = results.rows;

  return res.json({ companies });

});

/** Returns info on one company, JSON  like {company: {code, name, description}}*/
router.get('/:code', async function (req, res, next) {

  const code = req.params.code;

  // if(!code) throw new BadRequestError("Must include code")

  const results = await db.query(
    `SELECT code, name, description
    FROM companies
    WHERE code = $1`, [code]
  );

  const company = results.rows[0];

  if (!company) throw new NotFoundError(`Company not found, id: ${code}`);

  return res.json({company})

})

module.exports = router;