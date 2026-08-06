# Meridian Bank - Employee Help Guide

## Deposits

To process a deposit, go to Transactions > Deposit. Select the account,
enter the amount, and submit. Deposits up to Rs 100,000 are processed
immediately. Deposits above Rs 100,000 require approval from an Admin,
Branch Manager, or SuperAdmin before the funds are added to the account.

## Withdrawals

To process a withdrawal, go to Transactions > Withdraw. Select the account
and enter the amount. The system checks the account balance before allowing
the withdrawal - if the balance is insufficient, the transaction is rejected
and logged in the audit trail. Withdrawals above Rs 100,000 require approval,
same as deposits.

## Transfers

To transfer money between two accounts, go to Transactions > Transfer.
Select the sender account, the receiver account, and the amount. The system
locks both accounts briefly during the transfer to prevent double-spending.
Transfers above Rs 100,000 require approval.

## Maker-Checker Approval Process

Meridian Bank uses a maker-checker (four-eyes) system for large transactions.
Any deposit, withdrawal, or transfer above Rs 100,000 is placed in a "Pending"
state instead of processing immediately. It appears in Pending Approvals for
Admin, Branch Manager, and SuperAdmin roles to review.

Important rule: the person who initiates a transaction can never approve or
reject their own transaction. A different authorized employee must review it.
This prevents any single employee from moving large sums of money alone.

SuperAdmin transactions are exempt from the approval threshold and always
process immediately, regardless of amount.

To approve or reject a pending transaction, go to Pending Approvals, review
the transaction details (amount, accounts involved, who initiated it), and
click Approve or Reject. Rejected transactions never move any money - the
accounts are unaffected.

## Account Types

Meridian Bank offers three account types:

Savings accounts earn profit (interest) and are meant for regular saving.
Several named products exist under Savings (Regular Savings, Digital Savings,
Premium Savings, Freelancer Savings) - these are the same underlying account
type with different profit rates and marketing names.

Current accounts do not earn profit and are meant for frequent transactions,
often used by businesses.

Term Deposit accounts lock a fixed amount of money for a set period (3, 6,
12, or 24 months) in exchange for a higher profit rate. Term Deposits cannot
be used for deposits, withdrawals, or transfers while locked - the money is
only accessible again at maturity, or earlier with a penalty.

## Opening a New Account

Go to Accounts > Open Account. Select the customer, choose an Account Type
(Savings, Current, or Term Deposit), then select a specific Product from
the dropdown (the list filters automatically based on the type you chose).
Enter the initial balance and submit. The system generates a unique 8-digit
account number automatically - staff do not choose account numbers manually.

A customer can have more than one account, including multiple accounts of
the same type (for example, two separate Savings accounts for different
purposes) - each is distinguished by its product name/nickname.

## Term Deposit Maturity and Early Closure

Every Term Deposit has a Maturity Date, calculated automatically from the
term length chosen at account opening. If a Term Deposit is closed on or
after its maturity date, the customer receives the full principal plus the
agreed profit. If it is closed before maturity, a penalty (typically 2% of
the principal) is deducted, and no profit is paid for the incomplete term.

To close a Term Deposit, go to Accounts, find the Term Deposit, and click
Close. You will be asked to select which of the customer's other accounts
should receive the payout. Customers cannot close their own Term Deposits
through online banking - this must be done by staff at a branch, matching
standard banking practice for premature encashment.

## Roles and Permissions

SuperAdmin: full system access. Only SuperAdmin can create, suspend, or
promote other employees, and create new branches. SuperAdmin sees data
across all branches, not just their own.

Admin and Branch Manager: can manage customers, accounts, and transactions
within their own branch. Can approve or reject pending transactions. Cannot
create or manage employee accounts.

Teller: handles day-to-day deposits, withdrawals, transfers, and customer/
account creation within their own branch. Cannot approve pending transactions.

Auditor: read-only access. Can view customers, accounts, transactions, and
the audit log across all branches, but cannot create, edit, or process
anything.

Customer: self-service role for the online banking portal only. Customers
can only see and act on their own accounts, never anyone else's.

## Branch Scoping

Admin, Branch Manager, and Teller only see customers and accounts that
belong to their own branch. SuperAdmin and Auditor see all branches. This
is enforced automatically by the system based on which branch the logged-in
employee is assigned to - there is no way to view another branch's data
without SuperAdmin or Auditor access.

## Employee Account Management (SuperAdmin only)

To add a new employee, go to Employees > Add Employee. Fill in name, email,
a temporary password, their role, and their branch. The employee can log in
immediately using the credentials you set - they are not asked to change
their password on first login, though they can change it anytime from the
sidebar.

If an employee enters the wrong password 5 times in a row, their account is
automatically locked. Only a SuperAdmin can unlock it, from the Employees
page, by changing their status back to Active.

An employee can never suspend or lock their own account, even by mistake -
the system blocks this. The system also refuses to deactivate the very last
active SuperAdmin, to make sure there is always at least one person who can
manage the system.

## Password Management

Any employee can change their own password from the "Change Password" link
in the sidebar. You need your current password to set a new one. There is
currently no self-service "forgot password" - if an employee forgets their
password entirely, a SuperAdmin must reset it for them (this feature is
planned but not yet built).

## Customer Online Banking Registration

Customers do not create accounts online - an account must first be opened
by staff at a branch, with proper identity verification. Afterward, the
customer can register for online banking access themselves using the
"Register" page, by entering their CNIC and an existing account number
exactly as they appear on bank records. This proves it's really them, then
lets them set a password. If a customer says their account/CNIC doesn't
match, double check for typos, or confirm the account was actually opened
by a branch first.

## Bill Payments

Customers can pay utility bills (electricity, gas, water, mobile, internet)
through the online banking portal under Pay Bills. They choose a biller,
enter their consumer number, and an amount, then confirm. The amount is
debited directly from their selected account. Bill payments cannot be made
from a Term Deposit account, since those are locked.

## Audit Log

Every significant action in the system - deposits, withdrawals, transfers,
account creation, employee status changes, approvals and rejections - is
recorded in the Audit Log with who did it, when, and what happened. The
Audit Log cannot be edited or deleted by anyone through the app; it is a
permanent record. SuperAdmin, Admin, Branch Manager, and Auditor can all
view it.

## Common Troubleshooting

If a transaction fails with "Insufficient balance", the account does not
have enough money for the requested amount - check the account's current
balance under Accounts.

If a transaction fails with "This account does not belong to you" (customer
portal) or a branch-scoping related error (staff side), the account being
referenced is outside what that user is allowed to access.

If someone cannot log in and says their account is locked, check Employees
(for staff) - only a SuperAdmin can reactivate a locked account.

If a customer cannot register for online banking, confirm their CNIC and
account number match exactly what's on file, and that they don't already
have online banking access (in which case they should log in, not register).