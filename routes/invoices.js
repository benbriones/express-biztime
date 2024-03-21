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
    `SELECT id, amt, paid, add_date, paid_date, code, name, description
    FROM invoices
    JOIN companies ON companies.code = invoices.comp_code
    WHERE id = $1`,
    [id]
  );

  const invoiceData = results.rows[0];

  if (!invoiceData) throw new NotFoundError(`Can't find invoice, ${id}`);


  const invoice = {
    id: invoiceData.id,
    amt: invoiceData.amt,
    paid: invoiceData.paid,
    add_date: invoiceData.add_date,
    paid_data: invoiceData.paid_date,
    company: {
      code: invoiceData.code,
      name: invoiceData.name,
      description: invoiceData.description
    }
  };

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

  if (!companyCodeExists) throw new NotFoundError("Invoice not found ");

  const results = await db.query(
    `INSERT INTO invoices (comp_code, amt)
    VALUES ($1, $2)
    RETURNING comp_code, amt`,
    [comp_code, amt]
  );

  const company = results.rows[0];

  return res.status(201).json({ company });

});


/** Updates an invoice
 * receives JSON like {amt}
 * returns JSON like {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
 */
router.put('/:id', async function (req, res) {

  const id = req.params.id;
  const amt = req.body.amt;

  if (!amt) throw new BadRequestError("Must include body");

  const results = await db.query(
    `UPDATE invoices
    SET amt = $1
    WHERE id = $2
    RETURNING id, comp_code, amt, paid, add_date, paid_date`,
    [amt, id]
  );
  const invoice = results.rows[0];

  if (!invoice) throw new NotFoundError("Invoice not found ");

  return res.json({ invoice: invoice });


});

/** Deletes an invoice
 * returns JSON like {status: "deleted"}
 */
router.delete('/:id', async function (req, res) {
  const id = req.params.id;

  const result = await db.query(
    `DELETE FROM invoices
    WHERE id = $1
    RETURNING id`,
    [id]
  );

  if (!(result.rows[0])) throw new NotFoundError();

  return res.json({ status: 'deleted' });

});




module.exports = router;