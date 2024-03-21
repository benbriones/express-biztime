"use strict";

const express = require("express");

const db = require("../db");
const router = new express.Router();

const { BadRequestError, NotFoundError } = require('../expressError');

/** return JSON of info on invoices like  {invoices: [{id, comp_code}, ...]} */
router.get('/', async function (req, res) {
  const results = await db.query(
    `SELECT id, comp_code
    FROM invoices
    ORDER BY id`
  );

  const invoices = results.rows;

  return res.json({ invoices });
});

module.exports = router;

/** return JSON of info on one invoice like
 * {invoice:
 * {id, amt, paid, add_date, paid_date, company: {code, name, description}} */

router.get('/:id', async function (req, res) {

  const id = Number(req.params.id);

  const results = await db.query(
    `SELECT id, amt, paid, add_date, paid_date, comp_code
    FROM invoices
    WHERE id = $1`,
    [id]
  );

  const invoice = results.rows[0];

  if (!invoice) throw new NotFoundError(`Can't find invoice, ${id}`);


  const company = await db.query(
    `SELECT code, name, description
    FROM companies
    WHERE code = $1`,
    [invoice.comp_code]
  );

  invoice.company = company.rows[0];

  return res.json({ invoice });
});


/**Recieves json.  Returns info on the new invoice, JSON  like
 * {invoice: {id, comp_code, amt,...}}*/
router.post('/', async function (req, res, next) {

  if (!req.body) throw new BadRequestError("Must include body"); // dont pass anything

  const { comp_code, amt } = req.body;

  const hasUndefined = [comp_code, amt].some(input => input === undefined);
  if (hasUndefined) throw new BadRequestError("Request must include all required fields");


  const companyResults = await db.query(
    `SELECT code
    FROM companies
    WHERE code = $1`,
    [comp_code]

  );
  const companyCodeExists = companyResults.rows[0];

  if (!companyCodeExists) throw new NotFoundError("Company code not found ");

  const results = await db.query(
    `INSERT INTO invoices (comp_code, amt)
    VALUES ($1, $2)
    RETURNING comp_code, amt`,
    [comp_code, amt]
  );

  const company = results.rows[0];

  return res.status(201).json({ company });

});


router.put('/:id', async function (req, res) {
  const id = req.params.id;
  const amt = req.body.amt;
  const results = await db.query(
    `UPDATE invoices
    SET amt = $1
    WHERE id = $2
    RETURNING id, comp_code, amt, paid, add_date, paid_date`,
    [amt, id]
  );
  const invoice = results.rows[0];
  if (!invoice) throw new NotFoundError("Company code not found ");

  return res.json({ invoice: invoice });


});
module.exports = router;