<div class="container mx-auto flex justify-center items-center md:p-4">
	<div class="flex flex-col grow items-center md:p-4">
		<div class="card variant-ghost-primary border-2 mx-2 my-4 p-4 w-3/4 md:w-1/2">
			<form>
				<div class="m-4 flex flex-col text-left">
					<label>
						<div class="my-2">Username:</div>
						<input class="w-full" name="username" id="username" type="text" required value="" />
					</label>
					<label>
						<div class="my-2">Password:</div>
						<input class="w-full" name="password" id="password" type="password" required value="" />
					</label>
				</div>
				<div class="flex justify-around mt-4 md:mt-8">
					<button type="submit" class="btn font-semibold md:btn-lg variant-filled-primary"
						>Submit</button
					>
					<button class="btn font-semibold md:btn-lg variant-filled-secondary">Cancel</button>
				</div>
			</form>
		</div>
	</div>
</div>
