import { test, expect } from '@playwright/test';
const delay = ms => new Promise(res => setTimeout(res, ms));

const login = async (page)=>{
  await page.goto('/login');
  await expect(
    page.getByRole('textbox',{name: /email address/i})).toBeVisible();
  await page.getByRole('textbox',{name: /email address/i}).fill('fawadstd@gmail.com');  
  await page.getByRole('textbox',{name: /password/i}).fill('12345678');  
  await page.getByRole('button',{name: /submit/i}).click();
  await expect(page.getByText('customers')).toBeVisible({ timeout: 10_000 });
  console.log('✅ Login E2E test passed');
}
const testStaff = async (page)=>{
  await page.getByRole('button',{name: /toggle sidebar/i}).click();
  await page.getByText(/staff management/i).click();
  await page.getByRole('button', { name: /submit staff/i }).click();
  await expect(page.getByText(/^(name is required)$/i)).toBeVisible();
  await delay(2000);
  let id = await page.getByRole('textbox', { name: /^id$/i }).inputValue();
  await page.getByRole('textbox', { name: /^name$/i }).fill('Test Staff');
  await page.getByRole('textbox', { name: /^nic#$/i }).fill('12345-6789012-3');
  await page.getByRole('textbox', { name: /^contact$/i }).fill('3012345678');
  await page.getByRole('textbox', { name: /^email$/i }).fill('teststaff@example.com');
  await page.getByRole('textbox', { name: /^address$/i }).fill('123 Test Street');
  await page.getByRole('button',{name: /staff type/i}).click();
  await page.getByText('Trainer').click();
  await page.getByRole('button',{name: /salary type/i}).click();
  await page.getByText('fixed').click();
  await page.getByRole('textbox', { name: /^salary$/i }).fill('50000');
  await page.getByRole('textbox', { name: /^trainer fee$/i }).fill('5000');
  await page.getByRole('textbox', { name: /^commission percentage$/i }).fill('15');
  await page.getByRole('button',{name: /submit staff/i }).click();
  await page.getByRole('button',{name: /save/i }).click();
  await expect(page.getByText('Staff member saved successfully.')).toBeVisible();
  await delay(3000);
  let newStaffId = await page.getByRole('textbox', { name: /^id$/i }).inputValue();
  //console.log('Old ID:', id, 'New ID:', newStaffId);
  expect(newStaffId).toBe((parseInt(id)+1).toString());
  await page.getByRole('button',{name: /^staff members$/i}).click();
  await expect(page.getByText('Test Staff')).toBeVisible();
  await page.getByText('Test Staff').click();
  await expect(page.getByRole('textbox', { name: /^name$/i })).toHaveValue('Test Staff');
  await page.getByRole('button',{name: /^delete$/i}).click();
  await page.getByRole('button',{name: /^delete staff$/i}).click();
  await expect(page.getByText('Staff member deleted successfully.')).toBeVisible();
  await delay(3000);
  await expect(page.getByText('Test Staff')).not.toBeVisible();
  console.log('✅ Staff member E2E test passed');
}
const  testPackages = async (page)=>{
    await page.getByRole('button',{name: /toggle sidebar/i}).click();
    page.getByText('packages').click();
    await expect(page.getByText('add package')).toBeVisible();
    await page.getByText('add package').click();
    page.getByText(/^(package name is required)$/i)
    await expect(page.getByText(/package name is required/i)).toBeVisible();  
    await page.getByText('clear selection').click();  
    await expect(page.getByText(/package name is required/i)).not.toBeVisible();
  // Add package
    await page.getByLabel('Package Name').fill('Test Package');
    await page.getByLabel('Package Fee').fill('100');
    await page.getByLabel(/^Duration$/).fill('30');
    await page.getByRole('button',{name: /package type/i}).click();
    await page.getByText('Months').click();
    await page.getByLabel('Admission Fee').fill('50');
    await page.getByLabel('Cancellation Duration').fill('5');
    await page.getByRole('button',{name: /submit package/i}).click();
    await page.getByRole('button',{name: /save/i}).click();
    await expect(page.getByText('Package saved')).toBeVisible();
    // wait for 3 seconds
    await delay(3000);
    await page.getByRole('button',{name: /^packages$/i}).click();
    await expect(page.getByText('Test Package')).toBeVisible();
    page.getByText('Test Package').click();
    await expect(page.getByLabel('Package Name')).toHaveValue('Test Package');
    await page.getByRole('button',{name: /^delete package$/i}).click();
    await page.getByRole('button',{name: /^delete$/i}).click();
    await expect(page.getByText('Package deleted!')).toBeVisible();
    await delay(3000);
    await expect(page.getByText('Test Package')).not.toBeVisible();
    console.log('✅ Package E2E test passed');
}
const testTemplates = async (page)=>{
  await page.getByRole('button',{name: /toggle sidebar/i}).click();
  await page.getByText(/templates/i).click();
  await expect(page.getByText('add template')).toBeVisible();
  await page.getByText('add template').click();
  await expect(page.getByText(/^(name is required)$/i)).toBeVisible();
  await delay(2000);
  await page.getByLabel('Template Name').fill('Test Template');
  await page.getByRole('button',{name: /template type/i}).click();
  await page.getByText('WhatsApp').click();
  await page.getByLabel('Template Content').fill('This is a test template content.');
  await page.getByRole('button',{name: /submit template/i}).click();
  await page.getByRole('button',{name: /save/i}).click();
  await expect(page.getByText('Template saved successfully.')).toBeVisible();
  await delay(3000);
  await page.getByRole('button',{name: /^select template$/i}).click();
  await expect(page.getByText('Test Template')).toBeVisible();
  await page.getByText('Test Template').click();
  await expect(page.getByLabel('Template Name')).toHaveValue('Test Template');
  await page.getByRole('button',{name: /^delete$/i}).click();
  await page.getByRole('button',{name: /^delete template$/i}).click();
  await expect(page.getByText('Template deleted successfully.')).toBeVisible();
  await delay(3000);
  await expect(page.getByText('Test Template')).not.toBeVisible();
  console.log('✅ Template E2E test passed');
}
test('login test', async ({ page }) => {
  await login(page)
  // await testPackages(page);
  // await testStaff(page);
  await testTemplates(page);
});
