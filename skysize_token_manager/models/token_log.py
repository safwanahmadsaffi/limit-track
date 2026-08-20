from odoo import models, fields

class SkysizeTokenLog(models.Model):
    _name = 'skysize.token.log'
    _description = 'SkySize Token Usage Log'
    _order = 'create_date desc'

    account_id = fields.Many2one('skysize.token.account', string='Token Account', required=True, ondelete='cascade')
    tokens_used = fields.Float(string='Tokens Deducted', required=True)
    balance_after = fields.Float(string='Balance After Transaction', required=True)
    reference = fields.Char(string='Usage Reference / Extension')
    create_date = fields.Datetime(string='Timestamp', readonly=True)
