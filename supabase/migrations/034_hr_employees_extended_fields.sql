alter table public.hr_employees add column if not exists location text not null default 'Barcelona';
alter table public.hr_employees add column if not exists role text not null default '';
alter table public.hr_employees add column if not exists department text not null default '';
alter table public.hr_employees add column if not exists manager text not null default '';
alter table public.hr_employees add column if not exists bonus numeric(12, 2) not null default 0;
alter table public.hr_employees add column if not exists salary_increase_amount numeric(12, 2) not null default 0;
alter table public.hr_employees add column if not exists holiday_calendar text not null default 'Spain (Catalonia)';
alter table public.hr_employees add column if not exists vacation_days_per_year integer not null default 22;
alter table public.hr_employees add column if not exists vacation_days_taken integer not null default 0;

update public.hr_employees
set salary_increase_amount = greatest(salary_current - salary_previous, 0)
where salary_increase_date is not null and salary_increase_amount = 0;

update public.hr_employees
set role = case id
  when 'hr-1' then 'Managing Director'
  when 'hr-2' then 'Operations Lead'
  when 'hr-3' then 'Training Manager'
  when 'hr-4' then 'Chief Pilot'
  when 'hr-5' then 'Sales Director'
  when 'hr-6' then 'Marketing Coordinator'
  when 'hr-7' then 'HR & Admin Lead'
  when 'hr-8' then 'Drone Technician'
  when 'hr-9' then 'Customer Success'
  when 'hr-10' then 'Finance Manager'
  when 'hr-11' then 'Instructor'
  when 'hr-12' then 'Junior Pilot'
  when 'hr-13' then 'Office Administrator'
  else role
end,
department = case id
  when 'hr-1' then 'Executive'
  when 'hr-2' then 'Operations'
  when 'hr-3' then 'Training'
  when 'hr-4' then 'Flight Operations'
  when 'hr-5' then 'Sales'
  when 'hr-6' then 'Marketing'
  when 'hr-7' then 'People'
  when 'hr-8' then 'Technical'
  when 'hr-9' then 'Customer Success'
  when 'hr-10' then 'Finance'
  when 'hr-11' then 'Training'
  when 'hr-12' then 'Flight Operations'
  when 'hr-13' then 'Administration'
  else department
end,
manager = case id
  when 'hr-1' then ''
  when 'hr-2' then 'María García'
  when 'hr-3' then 'María García'
  when 'hr-4' then 'Carlos Mendoza'
  when 'hr-5' then 'María García'
  when 'hr-6' then 'Ana Torres'
  when 'hr-7' then 'María García'
  when 'hr-8' then 'Carlos Mendoza'
  when 'hr-9' then 'Ana Torres'
  when 'hr-10' then 'María García'
  when 'hr-11' then 'Elena Ruiz'
  when 'hr-12' then 'Jordi Vila'
  when 'hr-13' then 'Lucía Fernández'
  else manager
end,
vacation_days_taken = case id
  when 'hr-1' then 8 when 'hr-2' then 6 when 'hr-3' then 5 when 'hr-4' then 7
  when 'hr-5' then 4 when 'hr-6' then 3 when 'hr-7' then 6 when 'hr-8' then 2
  when 'hr-9' then 4 when 'hr-10' then 5 when 'hr-11' then 2 when 'hr-12' then 1
  when 'hr-13' then 2
  else vacation_days_taken
end
where role = '';
