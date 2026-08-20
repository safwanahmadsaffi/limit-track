from odoo.tests.common import TransactionCase
from odoo.exceptions import ValidationError

class TestSkysizeTokens(TransactionCase):

    def setUp(self):
        super(TestSkysizeTokens, self).setUp()
        self.token_account = self.env['skysize.token.account'].create({
            'name': 'Test Account',
            'token_balance': 500.0,
            'token_limit': 1000.0,
        })

    def test_token_deduction(self):
        self.token_account.deduct_tokens(100.0, reference='Test Deduction')
        self.assertEqual(self.token_account.token_balance, 400.0)
        self.assertEqual(len(self.token_account.log_ids), 1)

    def test_insufficient_tokens(self):
        with self.assertRaises(ValidationError):
            self.token_account.deduct_tokens(600.0, reference='Overdraft')
